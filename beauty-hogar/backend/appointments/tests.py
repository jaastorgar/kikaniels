from datetime import timedelta, time
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from .models import Service, TimeSlot, Appointment, Notification

class AppointmentsWorkflowAndSecurityTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.admin = User.objects.create_user(
            email='pro@beautyhogar.cl',
            password='StrongPassword123!',
            first_name='Kika',
            last_name='Pro',
            phone='+56911111111',
            role='admin'
        )
        self.client_user = User.objects.create_user(
            email='client@beautyhogar.cl',
            password='StrongPassword123!',
            first_name='Maria',
            last_name='Lopez',
            phone='+56922222222',
            role='client'
        )
        self.tomorrow = timezone.now().date() + timedelta(days=1)

        self.service = Service.objects.create(
            provider=self.admin,
            name='Manicure Gel',
            description='Manicure completa',
            duration=60,
            price=25000,
            is_active=True
        )
        self.slot1 = TimeSlot.objects.create(
            provider=self.admin,
            date=self.tomorrow,
            start_time=time(10, 0),
            end_time=time(11, 0),
            status='available'
        )
        self.slot2 = TimeSlot.objects.create(
            provider=self.admin,
            date=self.tomorrow,
            start_time=time(11, 0),
            end_time=time(12, 0),
            status='available'
        )

    def test_full_booking_reschedule_cancel_and_rebook_flow(self):
        # 1. Cliente reserva slot1
        self.api.force_authenticate(user=self.client_user)
        res = self.api.post('/api/appointments/', {
            'service': self.service.id,
            'timeslot': self.slot1.id,
            'notes': 'Timbre 202'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        apt_id = res.data['id']
        self.slot1.refresh_from_db()
        self.assertEqual(self.slot1.status, 'occupied')

        # 2. Cliente NO puede confirmar su propia cita (403 Forbidden)
        forbidden_res = self.api.post(f'/api/appointments/{apt_id}/confirm/')
        self.assertEqual(forbidden_res.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Admin confirma y luego reagenda a slot2
        self.api.force_authenticate(user=self.admin)
        confirm_res = self.api.post(f'/api/appointments/{apt_id}/confirm/')
        self.assertEqual(confirm_res.status_code, status.HTTP_200_OK)

        resched_res = self.api.post(f'/api/appointments/{apt_id}/reschedule/', {
            'new_time_slot_id': self.slot2.id
        }, format='json')
        self.assertEqual(resched_res.status_code, status.HTTP_200_OK)

        self.slot1.refresh_from_db()
        self.slot2.refresh_from_db()
        self.assertEqual(self.slot1.status, 'available')
        self.assertEqual(self.slot2.status, 'occupied')

        # 4. Se cancela la cita y slot2 vuelve a estar disponible y se puede volver a reservar
        cancel_res = self.api.post(f'/api/appointments/{apt_id}/cancel/')
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)
        self.slot2.refresh_from_db()
        self.assertEqual(self.slot2.status, 'available')

        self.api.force_authenticate(user=self.client_user)
        rebook_res = self.api.post('/api/appointments/', {
            'service': self.service.id,
            'timeslot': self.slot2.id
        }, format='json')
        self.assertEqual(rebook_res.status_code, status.HTTP_201_CREATED)

    def test_notifications_read_and_delete(self):
        apt = Appointment.objects.create(
            client=self.client_user,
            service=self.service,
            timeslot=self.slot1
        )
        notif = Notification.objects.create(
            user=self.client_user,
            appointment=apt,
            message='Notificación de prueba'
        )
        self.api.force_authenticate(user=self.client_user)

        count_res = self.api.get('/api/appointments/notifications/unread_count/')
        self.assertEqual(count_res.status_code, status.HTTP_200_OK)
        self.assertEqual(count_res.data['unread_count'], 1)

        read_res = self.api.post(f'/api/appointments/notifications/{notif.id}/read/')
        self.assertEqual(read_res.status_code, status.HTTP_200_OK)

        del_res = self.api.delete(f'/api/appointments/notifications/{notif.id}/')
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
