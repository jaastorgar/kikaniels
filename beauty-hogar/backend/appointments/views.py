from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
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
        return request.user.is_authenticated and request.user.role == 'admin'

# --- VIEWSETS CON AISLAMIENTO DE DATOS ---

class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'admin':
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

    def get_queryset(self):
        user = self.request.user
        
        # 1. Si es Admin, ve su propia agenda de gestión
        if user.is_authenticated and user.role == 'admin':
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

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Appointment.objects.select_related(
            'client', 'service', 'timeslot'
        ).order_by('-created_at')

        if user.role == 'admin':
            # MULTI-TENANCY: El admin solo ve citas de SUS servicios
            return queryset.filter(service__provider=user)
        return queryset.filter(client=user)

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = 'confirmed'
        appointment.save()
        return Response({'status': 'cita confirmada'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = 'cancelled'
        appointment.save()
        return Response({'status': 'cita cancelada'})

# --- SISTEMA DE NOTIFICACIONES ---

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

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
    """Contador dinámico para AdminHeader.jsx."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})

# --- DASHBOARD Y UTILIDADES ---

class AdminDashboardStatsView(APIView):
    """Resumen operativo del panel."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        stats = Appointment.objects.filter(service__provider=request.user).aggregate(
            total_appointments=Count('id'),
            total_revenue=Sum('total_price', default=0),
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

        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            current_time = datetime.strptime(start_time_str, '%H:%M')
            end_time = datetime.strptime(end_time_str, '%H:%M')

            created_slots = 0
            while current_time + timedelta(minutes=interval) <= end_time:
                slot_end = current_time + timedelta(minutes=interval)
                TimeSlot.objects.create(
                    provider=request.user,
                    date=date,
                    start_time=current_time.time(),
                    end_time=slot_end.time()
                )
                created_slots += 1
                current_time = slot_end

            return Response({"message": f"Se crearon {created_slots} horarios."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)