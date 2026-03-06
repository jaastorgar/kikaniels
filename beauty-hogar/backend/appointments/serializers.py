from rest_framework import serializers
from .models import Service, TimeSlot, Appointment, Notification
from users.serializers import UserSerializer

class ServiceSerializer(serializers.ModelSerializer):
    # Mostramos el email del proveedor pero lo marcamos como solo lectura
    provider_email = serializers.EmailField(source='provider.email', read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'provider', 'provider_email', 'name', 'description', 
            'duration', 'price', 'is_active', 'image'
        ]
        # El provider se asigna automáticamente en la vista
        read_only_fields = ['provider']

class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ['id', 'provider', 'date', 'start_time', 'end_time', 'status']
        read_only_fields = ['provider']

class AppointmentSerializer(serializers.ModelSerializer):
    # Detalles expandidos para facilitar el renderizado en React
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
        # SOLUCIÓN AL ERROR 400: Campos que el frontend NO debe enviar
        read_only_fields = ['client', 'status', 'total_price', 'created_at', 'updated_at']

    def validate(self, data):
        """
        Validaciones de integridad de negocio para Beauty Hogar.
        """
        timeslot = data.get('timeslot')
        
        # 1. Validar disponibilidad solo si es una cita nueva
        if not self.instance:  
            if timeslot.status != 'available':
                raise serializers.ValidationError(
                    {"timeslot": "Lo sentimos, este horario ya fue reservado."}
                )
        
        # 2. Validar Multi-tenancy: Servicio y Horario deben ser del mismo profesional
        service = data.get('service')
        if service and timeslot and service.provider != timeslot.provider:
            raise serializers.ValidationError(
                {"error": "El servicio y el horario deben pertenecer al mismo profesional."}
            )
            
        return data

    def create(self, validated_data):
        # Sincronizamos el precio de la cita con el precio actual del servicio
        service = validated_data.get('service')
        validated_data['total_price'] = service.price
        return super().create(validated_data)

class NotificationSerializer(serializers.ModelSerializer):
    appointment_details = AppointmentSerializer(source='appointment', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'user', 'appointment', 'appointment_details', 'message', 'is_read', 'created_at']
        read_only_fields = ['created_at']

class DashboardStatsSerializer(serializers.Serializer):
    total_appointments = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_appointments = serializers.IntegerField()
    confirmed_appointments = serializers.IntegerField()
    total_clients = serializers.IntegerField()