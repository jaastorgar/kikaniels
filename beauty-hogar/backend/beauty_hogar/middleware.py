from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(token_key):
    try:
        # Validamos el token JWT
        token = AccessToken(token_key)
        # Buscamos al usuario por el ID contenido en el token
        return User.objects.get(id=token['user_id'])
    except Exception:
        # Si el token es inválido o expiró, devolvemos un usuario anónimo
        return AnonymousUser()

class JWTAuthMiddleware:
    """
    Middleware personalizado para Django Channels que autentica 
    usuarios usando un token JWT pasado en la Query String.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # Extraemos los parámetros de la URL (ej: ?token=xyz...)
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]
        
        if token:
            # Si hay token, intentamos identificar al usuario
            scope["user"] = await get_user(token)
        else:
            # Si no hay token, la conexión será anónima (y rechazada por el consumer)
            scope["user"] = AnonymousUser()
            
        return await self.app(scope, receive, send)