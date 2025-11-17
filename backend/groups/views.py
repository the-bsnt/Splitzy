from rest_framework.views import APIView
from rest_framework import generics, mixins
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.contrib.auth import get_user_model

from .models import Groups, Membership, Invitation
from .serializers import GroupsSerializer, MembershipSerializer, InvitationSerializer
import secrets


class GroupListCreateView(
    generics.GenericAPIView,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
):
    queryset = Groups.objects.all()
    serializer_class = GroupsSerializer

    def get_queryset(self, *args, **kwargs):
        qs = super().get_queryset()
        user = self.request.user
        return qs.filter(membership__user_id=user)

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)


class GroupDetailView(
    generics.GenericAPIView,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
):
    queryset = Groups.objects.all()
    serializer_class = GroupsSerializer

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    # make updatable only by admin
    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        # make deletable onnly by admin
        return self.destroy(request, *args, **kwargs)


class MembersListCreateView(
    generics.GenericAPIView, mixins.ListModelMixin, mixins.CreateModelMixin
):
    queryset = Membership.objects.all()
    serializer_class = MembershipSerializer

    def get_queryset(self):
        group_id = self.kwargs.get("pk")
        return Membership.objects.filter(group_id=group_id)

    def get(self, request, *args, **kwargs):
        group = kwargs.get("pk")
        try:
            group = Groups.objects.get(id=group)
        except Groups.DoesNotExist:
            raise ValidationError("Group Does not exists")
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)


class MembersDetailView(
    generics.GenericAPIView,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
):
    queryset = Membership.objects.all()
    serializer_class = MembershipSerializer
    lookup_field = "id"

    def get_queryset(self):
        return super().get_queryset()

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        member = get_object_or_404(Membership, id=kwargs.get("id"))
        if member.user_id == member.group_id.admin:
            raise ValidationError("Admin can not be deleted. To delete Transfer Admin.")
        return self.destroy(request, *args, **kwargs)


class InvitationView(APIView):
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        member = get_object_or_404(Membership, id=kwargs.get("id"))
        group = get_object_or_404(Groups, id=kwargs.get("pk"))
        token = secrets.token_urlsafe(75)
        invitation = {
            "invited_email": member.email,
            "group_id": group.id,
            "token": token,
        }

        serializer = InvitationSerializer(data=invitation)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            self.send_invitation(serializer.data, group)
            response = Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
            )
            return response

    def send_invitation(self, invitation_details, group):
        HOST_DOMAIN = settings.HOST_DOMAIN
        subject = f"You're invited to join {group} on Splitzy!"
        invited_email = invitation_details.get("invited_email")
        token = invitation_details.get("token")
        context = {
            "invited_email": invited_email,
            "group_name": group,
            "invitation_link": f"{HOST_DOMAIN}/api/groups/join/?token={token}",
            "invited_by": "admin",  # replace it with invited_by_user
            "expiration_days": 7,  # adjust as needed
            "logo_url": "https://your-domain.com/static/splitzy-logo.png",
            "support_link": "https://your-domain.com/support",
        }
        html_message = render_to_string("invitation_email.html", context)
        plain_message = strip_tags(html_message)

        try:
            # use celery and redis for to make email async and fast
            send_mail(
                subject,
                plain_message,
                settings.EMAIL_HOST_USER,
                [invited_email],
                html_message=html_message,
                fail_silently=False,
            )

        except Exception as e:
            return Response({"detail": str(e)})


class AcceptInvitationView(APIView):
    def post(self, request, *args, **kwargs):
        token = request.GET.get("token")
        if not token:
            return Response(
                {"detail": "Invitation token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            invitation_instance = Invitation.objects.get(token=token)
        except Invitation.DoesNotExist:
            return Response(
                {"detail": "Token not valid"}, status=status.HTTP_401_UNAUTHORIZED
            )

        group = invitation_instance.group_id
        email = invitation_instance.invited_email

        # check user is already in the system or not
        User = get_user_model()
        user = User.objects.filter(email=email).first()

        # if user is not registered yet
        if not user:
            return Response(
                {"detail": "User have to be registered"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        # but i can check user is registered or not before sending invitaiton.

        # if user is already registered into the system but not authenticated.
        if user.is_authenticated:
            pass
