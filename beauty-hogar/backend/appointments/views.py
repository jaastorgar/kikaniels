from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Service, TimeSlot, Appointment
from .serializers import ServiceSerializer, TimeSlotSerializer, AppointmentSerializer

# --- PERMISOS PERSONALIZADOS ---
class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

# --- VIEWSETS OPTIMIZADOS ---

class ServiceViewSet(viewsets.ModelViewSet):
    """
    CRUD de servicios. Solo admins pueden crear/editar/borrar.
    """
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.AllowAny()]

class TimeSlotViewSet(viewsets.ModelViewSet):
    """
    Gestión de horarios.
    """
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer

    def get_queryset(self):
        # Opcional: Filtrar solo slots disponibles para clientes
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            return TimeSlot.objects.all()
        return TimeSlot.objects.filter(status='available', date__gte=timezone.now().date())

class AppointmentViewSet(viewsets.ModelViewSet):
    """
    Gestión de citas con optimización de consultas SQL.
    """
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # OPTIMIZACIÓN: select_related realiza un JOIN en SQL para traer 
        # cliente, servicio y horario en UNA SOLA consulta.
        queryset = Appointment.objects.select_related(
            'client', 
            'service', 
            'timeslot'
        ).order_class('-created_at')

        if user.role == 'admin':
            return queryset
        return queryset.filter(client=user)

    def perform_create(self, serializer):
        # Al crear, el precio se toma automáticamente del servicio (lógica en serializer/model)
        serializer.save(client=self.request.user)

# --- VISTAS ESPECIALIZADAS ---

class BulkCreateTimeSlotsView(APIView):
    """
    Creación masiva de horarios para el administrador.
    """
    permission_classes = [IsAdminUser]

    def post(self, request):
        date_str = request.data.get('date')
        start_time_str = request.data.get('start_time')
        end_time_str = request.data.get('end_time')
        interval = int(request.data.get('interval', 60))

        if not all([date_str, start_time_str, end_time_str]):
            return Response({"error": "Faltan datos requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            current_time = datetime.strptime(start_time_str, '%H:%M')
            end_time = datetime.strptime(end_time_str, '%H:%M')

            created_slots = 0
            while current_time + timedelta(minutes=interval) <= end_time:
                slot_end = current_time + timedelta(minutes=interval)
                
                # Evitar duplicados exactos
                if not TimeSlot.objects.filter(date=date, start_time=current_time.time()).exists():
                    TimeSlot.objects.create(
                        date=date,
                        start_time=current_time.time(),
                        end_time=slot_end.time()
                    )
                    created_slots += 1
                
                current_time = slot_end

            return Response({"message": f"Se crearon {created_slots} horarios exitosamente."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AdminDashboardStatsView(APIView):
    """
    Estadísticas rápidas para el Dashboard administrativo.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Agregaciones eficientes directas en la base de datos
        stats = Appointment.objects.aggregate(
            total_appointments=Count('id'),
            total_revenue=Sum('total_price', default=0),
            pending_appointments=Count('id', filter=Q(status='pending')),
            confirmed_appointments=Count('id', filter=Q(status='confirmed')),
            cancelled_appointments=Count('id', filter=Q(status='cancelled'))
        )
        
        # Próximas citas (hoy)
        today = timezone.now().date()
        upcoming = Appointment.objects.filter(
            timeslot__date=today, 
            status='confirmed'
        ).select_related('client', 'service', 'timeslot').count()

        stats['upcoming_today'] = upcoming
        
        return Response(stats)