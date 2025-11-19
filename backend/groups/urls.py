from django.urls import path
import uuid
from .views import (
    GroupListCreateView,
    GroupDetailView,
    MembersListCreateView,
    MembersDetailView,
    InvitationView,
    AcceptInvitationView,
)

app_name = "groups"
urlpatterns = [
    path("", GroupListCreateView.as_view(), name="group-list-create"),
    path("<uuid:pk>/", GroupDetailView.as_view(), name="group-detail"),
    path(
        "<uuid:pk>/members/",
        MembersListCreateView.as_view(),
        name="member-list-create",
    ),
    path(
        "<uuid:pk>/members/<uuid:id>/",
        MembersDetailView.as_view(),
        name="member-detail",
    ),
    path(
        "<uuid:pk>/members/<uuid:id>/invite/",
        InvitationView.as_view(),
        name="invite",
    ),
    path("join/", AcceptInvitationView.as_view(), name="accept-invitation"),
]
