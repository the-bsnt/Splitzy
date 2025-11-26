from rest_framework import serializers
from django.shortcuts import get_object_or_404
from django.db import transaction

# models
from .models import Groups, Membership, Invitation


class GroupsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Groups
        fields = "__all__"
        read_only_fields = ["created_at"]
        extra_kwargs = {"admin": {"required": False}}

    def validate(self, validated_data):
        request = self.context.get("request")
        if not request:
            raise serializers.ValidationError("Request context missing")
        if not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication Credentials Missing")

        return validated_data

    @transaction.atomic
    def create(self, validated_data):
        user = self.context.get("request").user
        validated_data["admin"] = user
        group_instance = super().create(validated_data)
        Membership.objects.create(
            name=user.name,
            email=user.email,
            group_id=group_instance,
            user_id=user,
            verified=True,
        )
        return group_instance


class MembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = "__all__"
        read_only_fields = ["group_id"]

    def create(self, validated_data):
        view = self.context.get("view")
        group_id = view.kwargs.get("pk")
        try:
            group = Groups.objects.get(id=group_id)
        except Groups.DoesNotExist:
            raise serializers.ValidationError("Group Id is invalid")
        validated_data["group_id"] = group

        email = validated_data.get("email")
        if Membership.objects.filter(group_id=group, email=email).exists():
            raise serializers.ValidationError(
                "Member with this email already exists in this group"
            )

        return super().create(validated_data)


class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = "__all__"

    # review this once again.
    def validate(self, attrs):
        # group = get_object_or_404(Groups,id=group)
        email = attrs.get("invited_email")
        group = attrs.get("group_id")
        member = get_object_or_404(Membership, email=email, group_id=group)
        if member.verified == True:
            raise serializers.ValidationError("Member is already Verified")
        invitation = Invitation.objects.filter(
            invited_email=email, group_id=group
        ).first()
        if invitation is not None:
            if (
                invitation.status != "E"
            ):  # check existing invitation is pending or accepted.
                raise serializers.ValidationError("Invitation Already Sent")
        return super().validate(attrs)
