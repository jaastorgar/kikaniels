import os
import secrets
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_admin', 'date_joined')
        # SEGURIDAD: Evita escalación de privilegios (Mass Assignment) en /api/users/profile/
        read_only_fields = ('id', 'email', 'role', 'is_admin', 'date_joined')

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
