from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Service, TimeSlot, Appointment, Notification
from .serializers import (
    ServiceSerializer, 
    TimeSlotSerializer, 
    AppointmentSerializer, 
    NotificationSerializer
)

# --- PERMISOS ---
class IsAdminUser(permissions.BasePermission):
    """Permiso para usuarios con rol admin."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == 'admin' or request.user.is_admin)
        )

# --- VIEWSETS CON AISLAMIENTO DE DATOS ---

class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.role == 'admin' or user.is_admin):
            # MULTI-TENANCY: El admin solo ve SUS servicios
            return Service.objects.filter(provider=user)
        return Service.objects.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.AllowAny()]

class TimeSlotViewSet(viewsets.ModelViewSet):
    serializer_class = TimeSlotSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.request.user
        
        # 1. Si es Admin, ve su propia agenda de gestión
        if user.is_authenticated and (user.role == 'admin' or user.is_admin):
            return TimeSlot.objects.filter(provider=user)
        
        # 2. FILTRADO PARA CLIENTES (Solución definitiva a la consecuencia de agenda)
        queryset = TimeSlot.objects.filter(status='available')

        # Capturamos los parámetros enviados desde BookAppointment.jsx
        date = self.request.query_params.get('date')
        provider_id = self.request.query_params.get('provider_id')

        # FILTRO DE FECHA: Si el cliente eligió un día en el calendario, solo mostramos ese día
        if date:
            queryset = queryset.filter(date=date)
        else:
            # Por defecto, solo mostrar de hoy en adelante
            queryset = queryset.filter(date__gte=timezone.now().date())
        
        # FILTRO DE PROFESIONAL: Solo mostramos los horarios del dueño del servicio
        if provider_id:
            queryset = queryset.filter(provider_id=provider_id)
            
        return queryset

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Devuelve únicamente los horarios disponibles desde hoy en adelante."""
        user = request.user
        queryset = TimeSlot.objects.filter(
            status='available',
            date__gte=timezone.now().date()
        )

        date = request.query_params.get('date')
        provider_id = request.query_params.get('provider_id')

        if user.is_authenticated and (user.role == 'admin' or user.is_admin) and not provider_id:
            queryset = queryset.filter(provider=user)
        elif provider_id:
            queryset = queryset.filter(provider_id=provider_id)

        if date:
            queryset = queryset.filter(date=date)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # SEGURIDAD: Solo un administrador puede modificar o eliminar registros directamente
        if self.action in ['update', 'partial_update', 'destroy', 'confirm', 'complete', 'reschedule']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = Appointment.objects.select_related(
            'client', 'service', 'timeslot'
        ).order_by('-created_at')

        if user.role == 'admin' or user.is_admin:
            # MULTI-TENANCY: El admin solo ve citas de SUS servicios
            return queryset.filter(service__provider=user)
        return queryset.filter(client=user)

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    def perform_destroy(self, instance):
        with transaction.atomic():
            if instance.status not in ['cancelled', 'completed']:
                TimeSlot.objects.filter(id=instance.timeslot_id).update(status='available')
            instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
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
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def complete(self, request, pk=None):
        appointment = self.get_object()
        if appointment.status == 'cancelled':
            return Response(
                {'error': 'No se puede completar una cita cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        appointment.status = 'completed'
        appointment.save()
        return Response({'status': 'cita completada'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
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
                new_slot = TimeSlot.objects.select_for_update().get(
                    id=new_slot_id,
                    provider=appointment.service.provider
                )
            except TimeSlot.DoesNotExist:
                return Response(
                    {'error': 'El horario seleccionado no existe o pertenece a otro profesional.'},
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
        # Cada usuario ve solo sus notificaciones
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        """Sincronizado con Notifications.jsx."""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'leída'})

class NotificationUnreadCountView(APIView):
    """Contador dinámico para AdminHeader.jsx y Layout.jsx."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count, 'count': count})

# --- DASHBOARD Y UTILIDADES ---

class AdminDashboardStatsView(APIView):
    """Resumen operativo del panel."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        stats = Appointment.objects.filter(service__provider=request.user).aggregate(
            total_appointments=Count('id'),
            total_revenue=Sum('total_price', filter=~Q(status='cancelled'), default=0),
            pending_appointments=Count('id', filter=Q(status='pending')),
            confirmed_appointments=Count('id', filter=Q(status='confirmed')),
            total_clients=Count('client', distinct=True)
        )
        return Response(stats)

class BulkCreateTimeSlotsView(APIView):
    """Creación masiva de horarios para un profesional."""
    permission_classes = [IsAdminUser]

    def post(self, request):
        date_str = request.data.get('date')
        start_time_str = request.data.get('start_time')
        end_time_str = request.data.get('end_time')
        interval = int(request.data.get('interval', 60))

        if interval <= 0:
            return Response({"error": "El intervalo debe ser mayor a 0 minutos."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            if date < timezone.now().date():
                return Response({"error": "No se pueden crear horarios en fechas pasadas."}, status=status.HTTP_400_BAD_REQUEST)

            current_time = datetime.strptime(start_time_str, '%H:%M')
            end_time = datetime.strptime(end_time_str, '%H:%M')

            if current_time >= end_time:
                return Response({"error": "La hora de término debe ser posterior a la hora de inicio."}, status=status.HTTP_400_BAD_REQUEST)

            created_slots = 0
            while current_time + timedelta(minutes=interval) <= end_time:
                slot_end = current_time + timedelta(minutes=interval)
                _, created = TimeSlot.objects.get_or_create(
                    provider=request.user,
                    date=date,
                    start_time=current_time.time(),
                    defaults={'end_time': slot_end.time()}
                )
                if created:
                    created_slots += 1
                current_time = slot_end

            return Response({"message": f"Se crearon {created_slots} horarios."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
