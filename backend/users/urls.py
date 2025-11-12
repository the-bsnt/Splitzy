from django.urls import path
from rest_framework_simplejwt.views import (
    TokenVerifyView,
    TokenBlacklistView,
)

from .views import (
    RegisterView,
    PasswordChangeView,
    ProfileView,
    RefreshTokenView,
    LoginView,
    LogoutView,
)

urlpatterns = [
    path("signup/", RegisterView.as_view(), name="signup"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshTokenView.as_view(), name="refresh-token"),
    path("verify/", TokenVerifyView.as_view(), name="token-verify"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("password/change/", PasswordChangeView.as_view(), name="password-change"),
    path("profile/", ProfileView.as_view(), name="user_profile"),
]
