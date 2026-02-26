from rest_framework import serializers
from .models import Service, TimeSlot, Appointment, Notification
from users.serializers import UserSerializer

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    time_slot = TimeSlotSerializer(read_only=True)
    service_id = serializers.IntegerField(write_only=True)
    time_slot_id = serializers.IntegerField(write_only=True)
    total_price = serializers.ReadOnlyField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'client', 'service', 'time_slot', 'service_id', 'time_slot_id',
            'status', 'notes', 'admin_notes', 'created_at', 'updated_at', 
            'whatsapp_notified', 'total_price'
        ]
        read_only_fields = ['created_at', 'updated_at', 'whatsapp_notified']

class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['service', 'time_slot', 'notes']

class NotificationSerializer(serializers.ModelSerializer):
    appointment = AppointmentSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['created_at']

class DashboardStatsSerializer(serializers.Serializer):
    total_appointments = serializers.IntegerField()
    pending_appointments = serializers.IntegerField()
    confirmed_appointments = serializers.IntegerField()
    completed_appointments = serializers.IntegerField()
    cancelled_appointments = serializers.IntegerField()
    today_appointments = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=0)