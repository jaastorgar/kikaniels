from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import Appointment, Notification
from .utils import send_appointment_notification

@receiver(post_save, sender=Appointment)
def handle_appointment_notifications(sender, instance, created, **kwargs):
    """
    Gestiona la creación de notificaciones en la DB y el envío por WebSocket
    tanto para administradores como para clientes.
    """
    def process_notification():
        # 1. SI LA CITA ES NUEVA -> Notificar al Administrador dueño del servicio
        if created:
            admin_user = instance.service.provider
            msg = f"Nueva cita recibida: {instance.service.name} de {instance.client.first_name}"
            
            # Guardamos la notificación en la DB para el historial y el contador
            Notification.objects.create(
                user=admin_user,
                appointment=instance,
                message=msg
            )
            
            # Enviamos la alerta en tiempo real al Admin específico
            send_appointment_notification(admin_user.id, {
                "id": instance.id,
                "title": "¡Nueva Reserva!",
                "message": msg,
                "status": instance.status,
                "is_new": True
            })

        # 2. SI EL ESTADO CAMBIÓ -> Notificar al Cliente
        # Verificamos si el campo 'status' fue el que cambió
        elif kwargs.get('update_fields') and 'status' in kwargs.get('update_fields'):
            client_user = instance.client
            status_msgs = {
                'confirmed': "¡Tu cita ha sido confirmada!",
                'cancelled': "Tu cita ha sido cancelada.",
                'completed': "¡Gracias por preferir Beauty Hogar! Tu servicio ha finalizado."
            }
            
            msg = status_msgs.get(instance.status, f"Tu cita ha cambiado a: {instance.status}")
            
            # Guardamos la notificación para el cliente en la DB
            Notification.objects.create(
                user=client_user,
                appointment=instance,
                message=msg
            )
            
            # Enviamos alerta en tiempo real al dispositivo del cliente
            send_appointment_notification(client_user.id, {
                "id": instance.id,
                "title": "Actualización de Cita",
                "message": msg,
                "status": instance.status,
                "is_new": False
            })

    # IMPORTANTE: Solo disparamos las notificaciones si la base de datos confirmó el guardado
    transaction.on_commit(process_notification)