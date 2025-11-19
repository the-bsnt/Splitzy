from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class InvitationAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that doesn't fail on invalid or missing tokens.
    Returns None instead of raising exceptions, allowing the view to handle
    unauthenticated requests gracefully.
    """

    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None  # no token -> treat as anonymous
        try:
            return super().authenticate(request)
        except AuthenticationFailed:
            return None  # invalid token ->treat as anonymous
