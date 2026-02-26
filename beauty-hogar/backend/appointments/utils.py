from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def send_appointment_notification(instance):
    """
    Función puente que toma una cita y envía el mensaje al socket.
    """
    channel_layer = get_channel_layer()
    group_name = f"user_{instance.client.id}"

    # Definimos los mensajes amigables
    status_messages = {
        'confirmed': "¡Tu cita ha sido confirmada!",
        'cancelled': "Lo sentimos, tu cita ha sido cancelada.",
        'completed': "¡Tu servicio ha finalizado!",
        'pending': "Tu cita está pendiente de revisión."
    }
    
    message = status_messages.get(instance.status, "Actualización en tu cita")

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "appointment_notification",
            "message": message,
            "appointment_id": instance.id,
            "status": instance.status
        }
    )