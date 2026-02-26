import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class AppointmentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
        else:
            self.group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        await self.send(text_data=json.dumps({
            'message': 'Conexión establecida',
            'type': 'connection'
        }))
    
    async def appointment_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'appointment_update',
            'appointment_id': event['appointment_id'],
            'status': event['status'],
            'message': event['message']
        }))
    
    @staticmethod
    async def notify_status_change(appointment_id, status, user_id):
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        
        message_map = {
            'confirmed': '¡Tu cita ha sido confirmada!',
            'cancelled': 'Tu cita ha sido cancelada',
            'rescheduled': 'Tu cita ha sido reagendada',
            'completed': 'Tu cita ha sido completada'
        }
        
        await channel_layer.group_send(
            f"user_{user_id}",
            {
                'type': 'appointment_notification',
                'appointment_id': appointment_id,
                'status': status,
                'message': message_map.get(status, 'Estado de cita actualizado')
            }
        )