from rest_framework.permissions import (
    BasePermission,
)
from django.shortcuts import get_object_or_404
from .models import Groups, Membership


class IsGroupAdmin(BasePermission):
    def has_permission(self, request, view):
        group_id = view.kwargs.get("pk")
        group = Groups.objects.filter(id=group_id).first()
        if not group:
            return True
        # if group doesnot exists, allow permssion and let view handle it
        return request.user.is_authenticated and group.admin == request.user


class IsGroupMember(BasePermission):
    def has_permission(self, request, view):
        group = Groups.objects.filter(id=view.kwargs.get("pk")).first()
        if not group:
            return True
        is_member = Membership.objects.filter(
            group_id=group.id, user_id=request.user.id
        ).exists()
        return request.user.is_authenticated and is_member


class IsSelfOrAdmin(BasePermission):
    def has_permission(self, request, view):
        member = Membership.objects.filter(id=view.kwargs.get("id")).first()
        if not member:
            return True
        group = Groups.objects.filter(id=view.kwargs.get("pk")).first()
        if not group:
            return True
        return member.user_id == request.user or group.admin == request.user
