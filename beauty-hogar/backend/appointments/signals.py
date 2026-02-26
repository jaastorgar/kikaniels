import asyncio
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import Appointment
from .utils import send_appointment_notification

@receiver(post_save, sender=Appointment)
def notify_appointment_change(sender, instance, **kwargs):
    """
    Se dispara cada vez que una cita se guarda.
    Usamos transaction.on_commit para asegurar que la DB ya cerró la sesión.
    """
    def send():
        # Ejecutamos la función asíncrona en el bucle de eventos
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        if loop.is_running():
            asyncio.ensure_future(send_appointment_notification(instance))
        else:
            loop.run_until_complete(send_appointment_notification(instance))

    transaction.on_commit(send)