from decimal import Decimal
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model

from .models import Service, TimeSlot, Appointment, Notification
from .serializers import (
    ServiceSerializer, 
    TimeSlotSerializer, 
    AppointmentSerializer, 
    NotificationSerializer
)
from .utils import send_appointment_notification

User = get_user_model()

# --- PERMISOS ---
class IsAdminUser(permissions.BasePermission):
    """Permiso exclusivo para usuarios con rol admin."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == 'admin' or request.user.is_admin)
        )

class IsProfessionalUser(permissions.BasePermission):
    """Permiso para administradores y especialistas (trabajadores)."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role in ['admin', 'worker'] or request.user.is_admin)
        )

# --- VIEWSETS ---

SPECIALTY_DEFAULT_SERVICES = {
    'peluquero': ('Peluquería y Corte a Domicilio', 'Servicio profesional de corte, lavado, brushing o estilismo a domicilio.'),
    'barbero': ('Barbería y Perfilado a Domicilio', 'Corte clásico o degradado (fade), perfilado de barba y toalla caliente a domicilio.'),
    'manicurista': ('Manicure y Diseño de Uñas', 'Manicure permanente, acrílicas o gel con esmaltado profesional a domicilio.'),
    'maquilladora': ('Maquillaje Profesional a Domicilio', 'Maquillaje social, eventos o novias con productos de larga duración.'),
    'cosmetologa': ('Tratamiento Facial y Cosmetología', 'Limpieza facial profunda e hidratación dermatológica a domicilio.'),
    'masajista': ('Masaje Descontracturante / Spa', 'Sesión de masoterapia profesional en la comodidad de tu hogar.'),
    'depilacion': ('Depilación Profesional a Domicilio', 'Servicio de depilación estética cuidadosa e higiénica a domicilio.'),
    'general': ('Servicio de Belleza Integral', 'Atención estética profesional a domicilio.'),
}


def ensure_worker_has_service(worker):
    """Garantiza que cada especialista tenga su servicio base creado para fijar precio/duración y que el Admin lo habilite."""
    if worker.role != 'worker':
        return
    if not Service.objects.filter(provider=worker).exists():
        title, desc = SPECIALTY_DEFAULT_SERVICES.get(
            worker.specialty,
            (f"Servicio de {worker.specialty_display}", f"Atención profesional de {worker.specialty_display} a domicilio.")
        )
        Service.objects.create(
            provider=worker,
            name=title,
            description=desc,
            price=Decimal('15000.00'),
            duration=60,
            is_active=False  # El Administrador debe habilitar el servicio para que sea visible al cliente
        )


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer

    def get_queryset(self):
        user = self.request.user
        mine = self.request.query_params.get('mine')

        if user.is_authenticated and user.role == 'worker':
            ensure_worker_has_service(user)
        elif user.is_authenticated and (user.role == 'admin' or user.is_admin):
            for w in User.objects.filter(role='worker'):
                ensure_worker_has_service(w)

        qs = Service.objects.select_related('provider').order_by('-id')

        if user.is_authenticated and mine == '1':
            return qs.filter(provider=user)

        if user.is_authenticated and user.role == 'worker' and self.action in ['update', 'partial_update']:
            return qs.filter(provider=user)

        if user.is_authenticated and (user.role == 'admin' or user.is_admin):
            return qs

        return qs.filter(is_active=True, provider__is_active=True)

    def _notify_worker_service_status(self, service, is_new=False):
        """Notifica en la campana y en tiempo real por WebSocket al especialista cuando su servicio es habilitado o deshabilitado."""
        provider = service.provider
        if not provider or provider.role != 'worker':
            return

        price_fmt = f"${int(service.price):,}".replace(",", ".")
        if service.is_active:
            msg = (
                f"✅ ¡Tu servicio '{service.name}' fue HABILITADO por el Administrador! "
                f"Ya aparece en el catálogo de clientes ({price_fmt} • {service.duration} min)."
            )
            ws_status = "confirmed"
            title = "Servicio Habilitado"
        else:
            msg = (
                f"⏸️ Tu servicio '{service.name}' fue DESHABILITADO del catálogo de clientes por el Administrador."
            )
            ws_status = "cancelled"
            title = "Servicio Deshabilitado"

        Notification.objects.create(
            user=provider,
            appointment=None,
            message=msg
        )
        send_appointment_notification(provider.id, {
            "id": service.id,
            "service_id": service.id,
            "event_type": "service_status_changed",
            "is_active": service.is_active,
            "target_path": "/worker/services",
            "title": title,
            "message": msg,
            "status": ws_status,
            "is_new": is_new
        })

        # También notificar por WebSocket a los clientes activos cuando se habilita un nuevo servicio de especialista
        if service.is_active:
            client_msg = (
                f"✨ Nuevo servicio disponible: '{service.name}' con {provider.full_name} "
                f"({provider.specialty_display}) por {price_fmt}."
            )
            for client in User.objects.filter(role='client', is_active=True):
                Notification.objects.create(
                    user=client,
                    appointment=None,
                    message=client_msg
                )
                send_appointment_notification(client.id, {
                    "id": service.id,
                    "service_id": service.id,
                    "event_type": "service_status_changed",
                    "is_active": True,
                    "target_path": "/services",
                    "title": "Nuevo Servicio Disponible",
                    "message": client_msg,
                    "status": "confirmed",
                    "is_new": True
                })

    def perform_create(self, serializer):
        user = self.request.user
        provider_id = self.request.data.get('provider_id')
        target_provider = user
        if (user.role == 'admin' or user.is_admin) and provider_id:
            try:
                target_provider = User.objects.get(pk=provider_id, role__in=['admin', 'worker'])
            except User.DoesNotExist:
                target_provider = user
        service = serializer.save(provider=target_provider)
        if target_provider.role == 'worker':
            self._notify_worker_service_status(service, is_new=True)

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        old_is_active = instance.is_active

        # Si es especialista (worker), solo puede modificar el precio, duración y descripción de su servicio
        if user.role == 'worker' and not user.is_admin:
            updated = serializer.save(
                provider=instance.provider,
                name=instance.name,
                is_active=instance.is_active
            )
            price_fmt = f"${int(updated.price):,}".replace(",", ".")
            admin_msg = (
                f"✂️ {user.full_name} ({user.specialty_display}) actualizó su servicio '{updated.name}': "
                f"Precio {price_fmt} y duración {updated.duration} min."
            )
            for adm in User.objects.filter(Q(role='admin') | Q(is_admin=True), is_active=True):
                Notification.objects.create(user=adm, appointment=None, message=admin_msg)
                send_appointment_notification(adm.id, {
                    "id": updated.id,
                    "service_id": updated.id,
                    "event_type": "worker_service_updated",
                    "target_path": "/admin/specialists",
                    "title": "Servicio de Especialista Actualizado",
                    "message": admin_msg,
                    "status": "confirmed",
                    "is_new": False
                })
            return

        provider_id = self.request.data.get('provider_id')
        target_provider = instance.provider
        if (user.role == 'admin' or user.is_admin) and provider_id:
            try:
                target_provider = User.objects.get(pk=provider_id, role__in=['admin', 'worker'])
            except User.DoesNotExist:
                target_provider = instance.provider

        updated = serializer.save(provider=target_provider)
        if old_is_active != updated.is_active and updated.provider.role == 'worker':
            self._notify_worker_service_status(updated, is_new=False)

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdminUser()]
        if self.action in ['update', 'partial_update']:
            return [IsProfessionalUser()]
        return [permissions.AllowAny()]

class TimeSlotViewSet(viewsets.ModelViewSet):
    serializer_class = TimeSlotSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsProfessionalUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.request.user
        provider_id = self.request.query_params.get('provider_id')
        date = self.request.query_params.get('date')

        if user.is_authenticated and user.role == 'worker':
            qs = TimeSlot.objects.filter(provider=user)
            if date:
                qs = qs.filter(date=date)
            return qs

        if user.is_authenticated and (user.role == 'admin' or user.is_admin):
            qs = TimeSlot.objects.select_related('provider').all()
            if provider_id:
                qs = qs.filter(provider_id=provider_id)
            if date:
                qs = qs.filter(date=date)
            return qs

        queryset = TimeSlot.objects.select_related('provider').filter(
            status='available',
            provider__is_active=True
        )
        if date:
            queryset = queryset.filter(date=date)
        else:
            queryset = queryset.filter(date__gte=timezone.now().date())

        if provider_id and str(provider_id) != 'all':
            queryset = queryset.filter(provider_id=provider_id)

        return queryset

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Devuelve los horarios disponibles desde hoy en adelante, filtrables por fecha y especialista."""
        queryset = TimeSlot.objects.select_related('provider').filter(
            status='available',
            provider__is_active=True,
            date__gte=timezone.now().date()
        )

        date = request.query_params.get('date')
        provider_id = request.query_params.get('provider_id')

        if provider_id and str(provider_id) not in ['all', 'any', '']:
            queryset = queryset.filter(provider_id=provider_id)

        if date:
            queryset = queryset.filter(date=date)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        user = self.request.user
        target_provider_id = self.request.data.get('provider_id')
        if (user.role == 'admin' or user.is_admin) and target_provider_id:
            try:
                target_user = User.objects.get(pk=target_provider_id, role__in=['admin', 'worker'])
                serializer.save(provider=target_user)
                return
            except User.DoesNotExist:
                pass
        serializer.save(provider=user)

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['destroy', 'assign_worker', 'mark_paid']:
            return [IsAdminUser()]
        if self.action in ['update', 'partial_update', 'confirm', 'complete', 'reschedule']:
            return [IsProfessionalUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = Appointment.objects.select_related(
            'client', 'service', 'timeslot', 'timeslot__provider', 'worker'
        ).order_by('-created_at')

        if user.role == 'admin' or user.is_admin:
            worker_id = self.request.query_params.get('worker_id')
            if worker_id:
                queryset = queryset.filter(worker_id=worker_id)
            return queryset
        if user.role == 'worker':
            return queryset.filter(Q(worker=user) | Q(timeslot__provider=user)).distinct()
        return queryset.filter(client=user)

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    def perform_destroy(self, instance):
        with transaction.atomic():
            if instance.status not in ['cancelled', 'completed']:
                TimeSlot.objects.filter(id=instance.timeslot_id).update(status='available')
            instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsProfessionalUser])
    def confirm(self, request, pk=None):
        appointment = self.get_object()
        if appointment.status in ['cancelled', 'completed']:
            return Response(
                {'error': 'No se puede confirmar una cita cancelada o completada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        appointment.status = 'confirmed'
        appointment.save()
        return Response({'status': 'cita confirmada'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        if appointment.status in ['completed', 'cancelled']:
            return Response(
                {'error': 'No se puede cancelar una cita que ya fue completada o cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        appointment.status = 'cancelled'
        appointment.save()
        return Response({'status': 'cita cancelada'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsProfessionalUser])
    def complete(self, request, pk=None):
        appointment = self.get_object()
        if appointment.status == 'cancelled':
            return Response(
                {'error': 'No se puede completar una cita cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        appointment.status = 'completed'
        appointment.save()
        return Response({
            'status': 'cita completada',
            'worker_earnings': float(appointment.worker_earnings),
            'business_earnings': float(appointment.business_earnings),
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def assign_worker(self, request, pk=None):
        """Permite al Administrador asignar o cambiar el especialista encargado de una cita."""
        appointment = self.get_object()
        worker_id = request.data.get('worker_id')
        if not worker_id:
            return Response({'error': 'Debes seleccionar un especialista.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            worker = User.objects.get(pk=worker_id, role__in=['admin', 'worker'], is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'Especialista no válido.'}, status=status.HTTP_404_NOT_FOUND)

        appointment.worker = worker
        if worker.role == 'worker':
            appointment.commission_rate = worker.commission_rate
        else:
            appointment.commission_rate = Decimal('0.00')
        appointment.save()

        if worker.role == 'worker':
            msg = f"📋 Se te asignó la cita de {appointment.service.name} para {appointment.client.first_name}."
            Notification.objects.create(user=worker, appointment=appointment, message=msg)
            send_appointment_notification(worker.id, {
                "id": appointment.id,
                "title": "Nueva Cita Asignada",
                "message": msg,
                "status": appointment.status,
                "is_new": True
            })

        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def mark_paid(self, request, pk=None):
        """Marca como pagada la comisión del especialista para esta cita completada."""
        appointment = self.get_object()
        if appointment.status != 'completed':
            return Response({'error': 'Solo se pueden liquidar citas completadas.'}, status=status.HTTP_400_BAD_REQUEST)
        if not appointment.worker or appointment.worker.role != 'worker':
            return Response({'error': 'Esta cita no tiene comisión de especialista asociada.'}, status=status.HTTP_400_BAD_REQUEST)

        appointment.payout_status = 'paid'
        appointment.paid_at = timezone.now()
        appointment.save()

        msg = f"💸 Se registró el pago de tu comisión (${int(appointment.worker_earnings):,}) por {appointment.service.name}."
        Notification.objects.create(user=appointment.worker, appointment=appointment, message=msg)
        send_appointment_notification(appointment.worker.id, {
            "id": appointment.id,
            "title": "Comisión Pagada",
            "message": msg,
            "status": "completed",
            "is_new": True
        })

        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['post'], permission_classes=[IsProfessionalUser])
    def reschedule(self, request, pk=None):
        appointment = self.get_object()
        if appointment.status in ['completed', 'cancelled']:
            return Response(
                {'error': 'No se puede reagendar una cita completada o cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_slot_id = request.data.get('new_time_slot_id')
        if not new_slot_id:
            return Response(
                {'error': 'Debe especificar el nuevo horario (new_time_slot_id).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            try:
                new_slot = TimeSlot.objects.select_for_update().get(id=new_slot_id)
            except TimeSlot.DoesNotExist:
                return Response(
                    {'error': 'El horario seleccionado no existe.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            if new_slot.status != 'available':
                return Response(
                    {'error': 'El horario seleccionado ya no está disponible.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            old_slot = appointment.timeslot
            if old_slot.id != new_slot.id:
                TimeSlot.objects.filter(id=old_slot.id).update(status='available')
                new_slot.status = 'occupied'
                new_slot.save()

            appointment.timeslot = new_slot
            appointment.status = 'rescheduled'
            appointment.save()

        return Response({'status': 'cita reagendada'})

# --- SISTEMA DE NOTIFICACIONES ---

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'leída'})

class NotificationUnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count, 'count': count})

# --- DASHBOARD Y UTILIDADES ---

class AdminDashboardStatsView(APIView):
    """Resumen operativo global del negocio para el Administrador."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        stats = Appointment.objects.aggregate(
            total_appointments=Count('id'),
            total_revenue=Sum('total_price', filter=~Q(status='cancelled'), default=Decimal('0.00')),
            business_net_revenue=Sum('business_earnings', filter=Q(status='completed'), default=Decimal('0.00')),
            pending_worker_payouts=Sum('worker_earnings', filter=Q(status='completed', payout_status='pending'), default=Decimal('0.00')),
            pending_appointments=Count('id', filter=Q(status='pending')),
            confirmed_appointments=Count('id', filter=Q(status='confirmed')),
            total_clients=Count('client', distinct=True),
        )
        stats['total_workers'] = User.objects.filter(role='worker', is_active=True).count()
        return Response(stats)

class WorkerDashboardStatsView(APIView):
    """Resumen de citas, comisiones y pagos para la vista del Especialista."""
    permission_classes = [IsProfessionalUser]

    def get(self, request):
        user = request.user
        qs = Appointment.objects.filter(Q(worker=user) | Q(timeslot__provider=user)).distinct()
        stats = qs.aggregate(
            total_appointments=Count('id'),
            pending_appointments=Count('id', filter=Q(status='pending')),
            confirmed_appointments=Count('id', filter=Q(status__in=['confirmed', 'rescheduled'])),
            completed_appointments=Count('id', filter=Q(status='completed')),
            total_generated=Sum('total_price', filter=Q(status='completed'), default=Decimal('0.00')),
            pending_payout=Sum('worker_earnings', filter=Q(status='completed', payout_status='pending'), default=Decimal('0.00')),
            paid_payout=Sum('worker_earnings', filter=Q(status='completed', payout_status='paid'), default=Decimal('0.00')),
            expected_active_earnings=Sum('worker_earnings', filter=Q(status__in=['pending', 'confirmed', 'rescheduled']), default=Decimal('0.00')),
        )
        stats['commission_rate'] = float(user.commission_rate or 60)
        stats['specialty_display'] = user.specialty_display
        return Response(stats)

class BulkCreateTimeSlotsView(APIView):
    """Creación masiva de horarios para un profesional (por fecha única o por días de trabajo de la semana)."""
    permission_classes = [IsProfessionalUser]

    def post(self, request):
        date_str = request.data.get('date')
        weekdays = request.data.get('weekdays')  # Lista de enteros [0=Lunes .. 6=Domingo]
        weeks = int(request.data.get('weeks', 2))
        start_time_str = request.data.get('start_time')
        end_time_str = request.data.get('end_time')
        interval = int(request.data.get('interval', 60))
        target_provider_id = request.data.get('provider_id')

        if interval <= 0:
            return Response({"error": "La duración del bloque debe ser mayor a 0 minutos."}, status=status.HTTP_400_BAD_REQUEST)

        provider = request.user
        if (request.user.role == 'admin' or request.user.is_admin) and target_provider_id:
            try:
                provider = User.objects.get(pk=target_provider_id, role__in=['admin', 'worker'])
            except User.DoesNotExist:
                pass

        try:
            start_dt_template = datetime.strptime(start_time_str, '%H:%M')
            end_dt_template = datetime.strptime(end_time_str, '%H:%M')

            if start_dt_template >= end_dt_template:
                return Response({"error": "La hora de término debe ser posterior a la hora de inicio."}, status=status.HTTP_400_BAD_REQUEST)

            today = timezone.now().date()
            target_dates = []

            if isinstance(weekdays, list) and len(weekdays) > 0:
                valid_weekdays = {int(d) for d in weekdays if 0 <= int(d) <= 6}
                if not valid_weekdays:
                    return Response({"error": "Selecciona al menos un día de trabajo válido."}, status=status.HTTP_400_BAD_REQUEST)
                weeks = max(1, min(weeks, 8))
                base_date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else today
                if base_date < today:
                    base_date = today
                for offset in range(weeks * 7):
                    candidate = base_date + timedelta(days=offset)
                    if candidate.weekday() in valid_weekdays:
                        target_dates.append(candidate)
            else:
                if not date_str:
                    return Response({"error": "Debes indicar una fecha o seleccionar tus días de trabajo."}, status=status.HTTP_400_BAD_REQUEST)
                single_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                if single_date < today:
                    return Response({"error": "No se pueden crear horarios en fechas pasadas."}, status=status.HTTP_400_BAD_REQUEST)
                target_dates.append(single_date)

            created_slots = 0
            for target_date in target_dates:
                current_time = start_dt_template
                while current_time + timedelta(minutes=interval) <= end_dt_template:
                    slot_end = current_time + timedelta(minutes=interval)
                    _, created = TimeSlot.objects.get_or_create(
                        provider=provider,
                        date=target_date,
                        start_time=current_time.time(),
                        defaults={'end_time': slot_end.time()}
                    )
                    if created:
                        created_slots += 1
                    current_time = slot_end

            return Response({
                "message": f"Se habilitaron {created_slots} turnos en {len(target_dates)} día(s) de trabajo.",
                "created_slots": created_slots,
                "days_count": len(target_dates)
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
