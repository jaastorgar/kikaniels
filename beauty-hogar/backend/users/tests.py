import os
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import User

class UserSecurityAndRoleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        os.environ['BEAUTY_ADMIN_SECRET'] = 'BEAUTY_ADMIN_SECRET_2024'

        self.admin_user = User.objects.create_user(
            email='admin_test@beautyhogar.cl',
            password='StrongPassword123!',
            first_name='Admin',
            last_name='Test',
            phone='+56911111111',
            role='admin'
        )
        self.normal_user = User.objects.create_user(
            email='cliente_test@beautyhogar.cl',
            password='StrongPassword123!',
            first_name='Cliente',
            last_name='Test',
            phone='+56922222222',
            role='client'
        )

    def test_admin_role_syncs_flags_and_group(self):
        self.assertTrue(self.admin_user.is_admin)
        self.assertTrue(self.admin_user.is_staff)
        self.assertEqual(self.admin_user.role, 'admin')
        self.assertTrue(self.admin_user.groups.filter(name='admin').exists())

    def test_client_cannot_escalate_privileges_via_profile(self):
        self.client.force_authenticate(user=self.normal_user)
        response = self.client.patch('/api/users/profile/', {
            'first_name': 'NuevoNombre',
            'role': 'admin',
            'is_admin': True
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.normal_user.refresh_from_db()
        self.assertEqual(self.normal_user.first_name, 'NuevoNombre')
        self.assertEqual(self.normal_user.role, 'client')
        self.assertFalse(self.normal_user.is_admin)

    def test_admin_registration_requires_valid_secret(self):
        # Con clave incorrecta debe fallar
        bad_res = self.client.post('/api/users/register/admin/', {
            'email': 'nuevo_admin@beautyhogar.cl',
            'first_name': 'Nuevo',
            'last_name': 'Admin',
            'phone': '+56933333333',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'secret_key': 'CLAVE_FALSA'
        }, format='json')
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Con clave correcta debe crear usuario con rol admin
        ok_res = self.client.post('/api/users/register/admin/', {
            'email': 'nuevo_admin@beautyhogar.cl',
            'first_name': 'Nuevo',
            'last_name': 'Admin',
            'phone': '+56933333333',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'secret_key': 'BEAUTY_ADMIN_SECRET_2024'
        }, format='json')
        self.assertEqual(ok_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ok_res.data['user']['role'], 'admin')
        self.assertTrue(ok_res.data['user']['is_admin'])
