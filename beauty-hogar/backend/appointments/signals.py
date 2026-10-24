from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import Appointment, Notification
from .utils import send_appointment_notification

@receiver(post_save, sender=Appointment)
def handle_appointment_notifications(sender, instance, created, **kwargs):
    """
    Gestiona la creación de notificaciones en la DB y el envío por WebSocket
    para Clientes, Especialistas y Administradores.
    """
    def process_notification():
        if created:
            admin_user = instance.service.provider
            worker_user = instance.worker
            msg = f"Nueva cita recibida: {instance.service.name} de {instance.client.first_name}"
            
            Notification.objects.create(user=admin_user, appointment=instance, message=msg)
            send_appointment_notification(admin_user.id, {
                "id": instance.id,
                "title": "¡Nueva Reserva!",
                "message": msg,
                "status": instance.status,
                "is_new": True
            })

            if worker_user and worker_user.id != admin_user.id:
                worker_msg = f"✨ Nueva cita agendada contigo: {instance.service.name} para {instance.client.first_name}"
                Notification.objects.create(user=worker_user, appointment=instance, message=worker_msg)
                send_appointment_notification(worker_user.id, {
                    "id": instance.id,
                    "title": "¡Nueva Cita en tu Agenda!",
                    "message": worker_msg,
                    "status": instance.status,
                    "is_new": True
                })
        else:
            client_user = instance.client
            status_msgs = {
                'confirmed': "✨ ¡Tu cita ha sido confirmada!",
                'rescheduled': "🔄 Tu cita ha sido reagendada a un nuevo horario.",
                'cancelled': "❌ Tu cita ha sido cancelada.",
                'completed': "✅ ¡Gracias por preferir Beauty Hogar! Tu servicio ha finalizado."
            }
            
            if instance.status in status_msgs:
                msg = status_msgs[instance.status]
                Notification.objects.create(user=client_user, appointment=instance, message=msg)
                send_appointment_notification(client_user.id, {
                    "id": instance.id,
                    "title": "Actualización de Cita",
                    "message": msg,
                    "status": instance.status,
                    "is_new": False
                })

    transaction.on_commit(process_notification)
