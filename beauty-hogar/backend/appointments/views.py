from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Service, TimeSlot, Appointment, Notification
from .serializers import (
    ServiceSerializer, TimeSlotSerializer, AppointmentSerializer,
    AppointmentCreateSerializer, NotificationSerializer, DashboardStatsSerializer
)

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin

class ServiceListCreateView(generics.ListCreateAPIView):
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [permissions.AllowAny()]

class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAdminUser]

class AvailableTimeSlotsView(generics.ListAPIView):
    serializer_class = TimeSlotSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = TimeSlot.objects.filter(
            status='available',
            date__gte=timezone.now().date()
        )
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        return queryset.order_by('date', 'start_time')

class TimeSlotListCreateView(generics.ListCreateAPIView):
    queryset = TimeSlot.objects.all().order_by('-date', '-start_time')
    serializer_class = TimeSlotSerializer
    permission_classes = [IsAdminUser]

class TimeSlotDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer
    permission_classes = [IsAdminUser]

class AppointmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    
    def get_permissions(self):
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Appointment.objects.all()
        return Appointment.objects.filter(client=user)
    
    def perform_create(self, serializer):
        # Obtener los IDs de los datos enviados
        service_id = self.request.data.get('service_id')
        time_slot_id = self.request.data.get('time_slot_id')
        
        # Obtener los objetos reales
        from .models import Service, TimeSlot
        service = Service.objects.get(id=service_id)
        time_slot = TimeSlot.objects.get(id=time_slot_id)
        
        # Guardar con los objetos completos
        serializer.save(
            client=self.request.user,
            service=service,
            time_slot=time_slot,
            status='pending'
        )

class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Appointment.objects.all()
        return Appointment.objects.filter(client=user)
    
    def perform_update(self, serializer):
        instance = serializer.save()
        # Crear notificación para el cliente
        if instance.client != self.request.user:
            status_text = {
                'confirmed': 'confirmada',
                'cancelled': 'cancelada',
                'rescheduled': 'reagendada',
                'completed': 'completada'
            }.get(instance.status, instance.status)
            
            Notification.objects.create(
                user=instance.client,
                appointment=instance,
                message=f"Tu cita ha sido {status_text}. Servicio: {instance.service.name}, Fecha: {instance.time_slot.date} {instance.time_slot.start_time.strftime('%H:%M')}"
            )

class AdminAppointmentActionView(APIView):
    permission_classes = [IsAdminUser]
    
    def post(self, request, pk, action):
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'error': 'Cita no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        if action == 'confirm':
            appointment.status = 'confirmed'
            message = "Cita confirmada exitosamente"
        elif action == 'cancel':
            appointment.status = 'cancelled'
            message = "Cita cancelada exitosamente"
        elif action == 'complete':
            appointment.status = 'completed'
            message = "Cita marcada como completada"
        else:
            return Response({'error': 'Acción no válida'}, status=status.HTTP_400_BAD_REQUEST)
        
        appointment.save()
        
        # Crear notificación
        Notification.objects.create(
            user=appointment.client,
            appointment=appointment,
            message=f"Tu cita para {appointment.service.name} el {appointment.time_slot.date} ha sido {appointment.get_status_display().lower()}"
        )
        
        return Response({
            'message': message,
            'appointment': AppointmentSerializer(appointment).data
        })

class RescheduleAppointmentView(APIView):
    permission_classes = [IsAdminUser]
    
    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
            new_time_slot_id = request.data.get('new_time_slot_id')
            
            if not new_time_slot_id:
                return Response({'error': 'Nuevo horario requerido'}, status=status.HTTP_400_BAD_REQUEST)
            
            new_time_slot = TimeSlot.objects.get(pk=new_time_slot_id)
            
            if new_time_slot.status != 'available':
                return Response({'error': 'El horario seleccionado no está disponible'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Liberar horario anterior
            old_time_slot = appointment.time_slot
            old_time_slot.status = 'available'
            old_time_slot.save()
            
            # Actualizar cita
            appointment.time_slot = new_time_slot
            appointment.status = 'rescheduled'
            appointment.save()
            
            # Crear notificación
            Notification.objects.create(
                user=appointment.client,
                appointment=appointment,
                message=f"Tu cita ha sido reagendada. Nueva fecha: {new_time_slot.date} {new_time_slot.start_time.strftime('%H:%M')}"
            )
            
            return Response({
                'message': 'Cita reagendada exitosamente',
                'appointment': AppointmentSerializer(appointment).data
            })
            
        except Appointment.DoesNotExist:
            return Response({'error': 'Cita no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        except TimeSlot.DoesNotExist:
            return Response({'error': 'Horario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        unread_count = queryset.filter(is_read=False).count()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'notifications': serializer.data,
            'unread_count': unread_count
        })

class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({'message': 'Notificación marcada como leída'})
        except Notification.DoesNotExist:
            return Response({'error': 'Notificación no encontrada'}, status=status.HTTP_404_NOT_FOUND)

class DashboardStatsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        today = timezone.now().date()
        
        stats = {
            'total_appointments': Appointment.objects.count(),
            'pending_appointments': Appointment.objects.filter(status='pending').count(),
            'confirmed_appointments': Appointment.objects.filter(status='confirmed').count(),
            'completed_appointments': Appointment.objects.filter(status='completed').count(),
            'cancelled_appointments': Appointment.objects.filter(status='cancelled').count(),
            'today_appointments': Appointment.objects.filter(time_slot__date=today).count(),
            'total_revenue': Appointment.objects.filter(
                status__in=['confirmed', 'completed']
            ).aggregate(total=Sum('service__price'))['total'] or 0
        }
        
        return Response(stats)

class ClientHistoryView(generics.ListAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Appointment.objects.filter(client=self.request.user).order_by('-created_at')

class BulkCreateTimeSlotsView(APIView):
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        date_str = request.data.get('date')  # Formato: YYYY-MM-DD
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        interval_minutes = int(request.data.get('interval_minutes', 60))
        
        if not all([date_str, start_time, end_time]):
            return Response({'error': 'Fecha, hora inicio y hora fin son requeridos'}, status=status.HTTP_400_BAD_REQUEST)
        
        from datetime import datetime, timedelta
        
        # Parsear la fecha directamente del string YYYY-MM-DD
        # Sin conversiones de zona horaria
        try:
            year, month, day = map(int, date_str.split('-'))
        except ValueError:
            return Response({'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear datetime combinando fecha y hora
        current_time = datetime.strptime(f"{date_str} {start_time}", "%Y-%m-%d %H:%M")
        end_datetime = datetime.strptime(f"{date_str} {end_time}", "%Y-%m-%d %H:%M")
        
        created_slots = []
        while current_time < end_datetime:
            slot_end = current_time + timedelta(minutes=interval_minutes)
            
            # Usar la fecha exacta del string original
            time_slot, created = TimeSlot.objects.get_or_create(
                date=date_str,  # Guardar el string exacto
                start_time=current_time.time(),
                defaults={
                    'end_time': slot_end.time(),
                    'status': 'available'
                }
            )
            
            if created:
                created_slots.append(TimeSlotSerializer(time_slot).data)
            
            current_time = slot_end
        
        return Response({
            'message': f'{len(created_slots)} horarios creados',
            'slots': created_slots
        })