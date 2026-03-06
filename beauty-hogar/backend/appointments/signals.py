from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import Appointment, Notification
from .utils import send_appointment_notification

@receiver(post_save, sender=Appointment)
def handle_appointment_notifications(sender, instance, created, **kwargs):
    """
    Gestiona la creación de notificaciones en la DB y el envío por WebSocket.
    """
    def process_notification():
        # 1. SI LA CITA ES NUEVA -> Notificar al Administrador
        if created:
            admin_user = instance.service.provider
            msg = f"Nueva cita recibida: {instance.service.name} de {instance.client.first_name}"
            
            Notification.objects.create(user=admin_user, appointment=instance, message=msg)
            
            send_appointment_notification(admin_user.id, {
                "id": instance.id,
                "title": "¡Nueva Reserva!",
                "message": msg,
                "status": instance.status,
                "is_new": True
            })

        # 2. SI ES UNA ACTUALIZACIÓN -> Notificar al Cliente
        else:
            client_user = instance.client
            status_msgs = {
                'confirmed': "✨ ¡Tu cita ha sido confirmada!",
                'cancelled': "❌ Tu cita ha sido cancelada.",
                'completed': "✅ ¡Gracias por preferir Beauty Hogar! Tu servicio ha finalizado."
            }
            
            # Si el estado actual es uno de los que requiere aviso, enviamos
            if instance.status in status_msgs:
                msg = status_msgs[instance.status]
                
                # Guardamos en la DB para el historial
                Notification.objects.create(user=client_user, appointment=instance, message=msg)
                
                # WebSocket: Envío en tiempo real
                send_appointment_notification(client_user.id, {
                    "id": instance.id,
                    "title": "Actualización de Cita",
                    "message": msg,
                    "status": instance.status,
                    "is_new": False
                })

    # IMPORTANTE: Solo disparamos tras confirmar el guardado en DB
    transaction.on_commit(process_notification)