import os
import secrets
from decimal import Decimal
from django.db.models import Sum, Count, Q
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    specialty_display = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'phone',
            'role', 'is_admin', 'is_active',
            'specialty', 'specialty_display', 'commission_rate', 'bio',
            'date_joined'
        )
        # SEGURIDAD: Evita escalación de privilegios o cambio unilateral de comisión en /api/auth/profile/
        read_only_fields = ('id', 'email', 'role', 'is_admin', 'is_active', 'commission_rate', 'date_joined')

class WorkerManagementSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=6)
    specialty_display = serializers.CharField(read_only=True)
    completed_count = serializers.SerializerMethodField()
    active_count = serializers.SerializerMethodField()
    total_generated = serializers.SerializerMethodField()
    pending_payout = serializers.SerializerMethodField()
    paid_payout = serializers.SerializerMethodField()
    business_profit = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'phone', 'password',
            'role', 'specialty', 'specialty_display', 'commission_rate', 'bio',
            'is_active', 'date_joined',
            'completed_count', 'active_count', 'total_generated',
            'pending_payout', 'paid_payout', 'business_profit', 'services'
        )
        read_only_fields = ('id', 'role', 'date_joined')

    def validate_commission_rate(self, value):
        val = Decimal(str(value))
        if val < 0 or val > 100:
            raise serializers.ValidationError("El porcentaje de comisión debe estar entre 0 y 100.")
        return val

    def validate(self, attrs):
        if not self.instance and not attrs.get('password'):
            raise serializers.ValidationError({"password": "Debes asignar una contraseña inicial para el especialista."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(
            **validated_data,
            password=password,
            role='worker',
            is_staff=False,
            is_admin=False
        )
        from appointments.views import ensure_worker_has_service
        ensure_worker_has_service(user)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

    def _get_stats(self, obj):
        if not hasattr(obj, '_cached_worker_stats'):
            from appointments.models import Appointment
            obj._cached_worker_stats = Appointment.objects.filter(worker=obj).aggregate(
                completed_count=Count('id', filter=Q(status='completed')),
                active_count=Count('id', filter=Q(status__in=['pending', 'confirmed', 'rescheduled'])),
                total_generated=Sum('total_price', filter=Q(status='completed'), default=Decimal('0.00')),
                pending_payout=Sum('worker_earnings', filter=Q(status='completed', payout_status='pending'), default=Decimal('0.00')),
                paid_payout=Sum('worker_earnings', filter=Q(status='completed', payout_status='paid'), default=Decimal('0.00')),
                business_profit=Sum('business_earnings', filter=Q(status='completed'), default=Decimal('0.00')),
            )
        return obj._cached_worker_stats

    def get_completed_count(self, obj):
        return self._get_stats(obj)['completed_count'] or 0

    def get_active_count(self, obj):
        return self._get_stats(obj)['active_count'] or 0

    def get_total_generated(self, obj):
        return float(self._get_stats(obj)['total_generated'] or 0)

    def get_pending_payout(self, obj):
        return float(self._get_stats(obj)['pending_payout'] or 0)

    def get_paid_payout(self, obj):
        return float(self._get_stats(obj)['paid_payout'] or 0)

    def get_business_profit(self, obj):
        return float(self._get_stats(obj)['business_profit'] or 0)

    def get_services(self, obj):
        from appointments.views import ensure_worker_has_service
        from appointments.serializers import ServiceSerializer
        ensure_worker_has_service(obj)
        return ServiceSerializer(obj.services.all().order_by('-id'), many=True).data

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Las contraseñas nuevas no coinciden."})
        try:
            validate_password(attrs['new_password'], user=self.context.get('user'))
        except DjangoValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})
        return attrs

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'phone', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data, role='client')
        return user

class AdminRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    secret_key = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'phone', 'password', 'password_confirm', 'secret_key')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        
        env_secret = os.getenv('BEAUTY_ADMIN_SECRET')
        provided_secret = attrs.pop('secret_key', '')
        if not env_secret or not secrets.compare_digest(provided_secret, env_secret):
            raise serializers.ValidationError({"secret_key": "Clave de administrador incorrecta."})

        try:
            validate_password(attrs['password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
            
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            **validated_data, 
            role='admin',
            is_staff=True,
            is_admin=True
        )
        return user
