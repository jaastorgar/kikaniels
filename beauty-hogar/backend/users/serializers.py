from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'role', 'date_joined']
        read_only_fields = ['id', 'role', 'date_joined']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'password', 'password_confirm']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class AdminRegistrationSerializer(serializers.ModelSerializer):
    secret_key = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'password', 'secret_key']
    
    def validate(self, attrs):
        if attrs.pop('secret_key') != 'BEAUTY_ADMIN_SECRET_2024':
            raise serializers.ValidationError({"secret_key": "Clave secreta inválida"})
        return attrs
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data, is_admin=True, role='admin')
        return user