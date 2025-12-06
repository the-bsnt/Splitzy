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
    CustomUsersListView,
)

urlpatterns = [
    path("auth/signup/", RegisterView.as_view(), name="signup"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", RefreshTokenView.as_view(), name="refresh-token"),
    path("auth/verify/", TokenVerifyView.as_view(), name="token-verify"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("profile/", ProfileView.as_view(), name="user_profile"),
    path("change/password/", PasswordChangeView.as_view(), name="change-password"),
    path("users/", CustomUsersListView.as_view(), name="list-users"),
]
