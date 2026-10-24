from django.utils import timezone
from rest_framework import serializers
from .models import Service, TimeSlot, Appointment, Notification
from users.serializers import UserSerializer

class ServiceSerializer(serializers.ModelSerializer):
    provider_email = serializers.EmailField(source='provider.email', read_only=True)
    provider_name = serializers.CharField(source='provider.full_name', read_only=True)
    provider_specialty = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            'id', 'provider', 'provider_email', 'provider_name', 'provider_specialty',
            'name', 'description', 'duration', 'price', 'is_active', 'image'
        ]
        read_only_fields = ['provider']

    def get_provider_specialty(self, obj):
        if not obj.provider:
            return 'Especialista'
        if obj.provider.role == 'worker':
            return obj.provider.specialty_display
        return 'Especialista Principal'

class TimeSlotSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.full_name', read_only=True)
    provider_specialty = serializers.CharField(source='provider.specialty_display', read_only=True)

    class Meta:
        model = TimeSlot
        fields = [
            'id', 'provider', 'provider_name', 'provider_specialty',
            'date', 'start_time', 'end_time', 'status'
        ]
        read_only_fields = ['provider']

    def validate(self, data):
        start_time = data.get('start_time', getattr(self.instance, 'start_time', None))
        end_time = data.get('end_time', getattr(self.instance, 'end_time', None))
        date = data.get('date', getattr(self.instance, 'date', None))

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                {"end_time": "La hora de término debe ser posterior a la hora de inicio."}
            )

        if not self.instance and date and date < timezone.now().date():
            raise serializers.ValidationError(
                {"date": "No se pueden crear horarios en fechas pasadas."}
            )

        return data

class AppointmentSerializer(serializers.ModelSerializer):
    client_details = UserSerializer(source='client', read_only=True)
    service_details = ServiceSerializer(source='service', read_only=True)
    timeslot_details = TimeSlotSerializer(source='timeslot', read_only=True)
    worker_details = UserSerializer(source='worker', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'client', 'service', 'timeslot', 'worker', 'status', 
            'total_price', 'commission_rate', 'worker_earnings', 'business_earnings',
            'payout_status', 'paid_at',
            'notes', 'created_at', 'updated_at',
            'client_details', 'service_details', 'timeslot_details', 'worker_details'
        ]
        read_only_fields = [
            'client', 'status', 'total_price',
            'commission_rate', 'worker_earnings', 'business_earnings',
            'payout_status', 'paid_at',
            'created_at', 'updated_at'
        ]

    def validate(self, data):
        timeslot = data.get('timeslot')
        service = data.get('service')

        if service and not service.is_active:
            raise serializers.ValidationError(
                {"service": "Este servicio no se encuentra disponible actualmente."}
            )
        
        if not self.instance and timeslot:  
            if timeslot.status != 'available':
                raise serializers.ValidationError(
                    {"timeslot": "Lo sentimos, este horario ya fue reservado."}
                )
            if timeslot.date < timezone.now().date():
                raise serializers.ValidationError(
                    {"timeslot": "No se puede reservar un horario de una fecha pasada."}
                )
            
        return data

    def create(self, validated_data):
        service = validated_data.get('service')
        timeslot = validated_data.get('timeslot')
        validated_data['total_price'] = service.price
        if not validated_data.get('worker') and timeslot:
            validated_data['worker'] = timeslot.provider
        return super().create(validated_data)

class NotificationSerializer(serializers.ModelSerializer):
    appointment_details = AppointmentSerializer(source='appointment', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'user', 'appointment', 'appointment_details', 'message', 'is_read', 'created_at']
        read_only_fields = ['user', 'appointment', 'message', 'created_at']

class DashboardStatsSerializer(serializers.Serializer):
    total_appointments = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_appointments = serializers.IntegerField()
    confirmed_appointments = serializers.IntegerField()
    total_clients = serializers.IntegerField()
