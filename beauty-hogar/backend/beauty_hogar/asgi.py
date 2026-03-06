import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from appointments.routing import websocket_urlpatterns
from beauty_hogar.middleware import JWTAuthMiddleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beauty_hogar.settings')

application = ProtocolTypeRouter({
    # Protocolo HTTP normal
    "http": get_asgi_application(),
    
    # Protocolo WebSocket con seguridad JWT
    "websocket": JWTAuthMiddleware( 
        URLRouter(
            websocket_urlpatterns
        )
    ),
})