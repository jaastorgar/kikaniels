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
    client_details = UserSerializer(source='client', read_only=True)
    service_details = ServiceSerializer(source='service', read_only=True)
    timeslot_details = TimeSlotSerializer(source='timeslot', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'client', 'service', 'timeslot', 'status', 
            'total_price', 'notes', 'created_at', 'updated_at',
            'client_details', 'service_details', 'timeslot_details'
        ]
        read_only_fields = ['total_price', 'created_at', 'updated_at']

    def validate(self, data):
        """
        Validación a nivel de Serializer para evitar reservas inválidas.
        """
        timeslot = data.get('timeslot')
        
        # 1. Verificar si el slot está disponible (Solo al crear)
        if not self.instance:  
            if timeslot.status != 'available':
                raise serializers.ValidationError(
                    {"timeslot": "Lo sentimos, este horario ya no está disponible."}
                )
        
        return data

    def create(self, validated_data):
        service = validated_data.get('service')
        validated_data['total_price'] = service.price
        return super().create(validated_data)

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