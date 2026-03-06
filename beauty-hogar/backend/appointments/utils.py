from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def send_appointment_notification(user_id, message_data):
    """
    Envía una notificación por WebSocket al canal específico del usuario.
    """
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    # El nombre del grupo es único por usuario (ej: user_5)
    group_name = f"user_{user_id}"

    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "appointment_notification",
                "notification": message_data
            }
        )
    except Exception as e:
        print(f"Error en WebSocket de Beauty Hogar: {e}")