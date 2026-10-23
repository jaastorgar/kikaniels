from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import UserSerializer, UserRegistrationSerializer, AdminRegistrationSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        user = User.objects.get(email__iexact=request.data.get('email', ''))
        response.data['user'] = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_admin': user.is_admin
        }
        return response

class RegisterClientView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': 'Usuario registrado exitosamente',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class RegisterAdminView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = AdminRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'admin_register'
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': 'Administrador registrado exitosamente',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class CheckAdminExistsView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        admin_exists = User.objects.filter(role='admin', is_active=True).exists()
        return Response({'admin_exists': admin_exists})
