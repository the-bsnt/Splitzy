from rest_framework.views import APIView
from rest_framework import generics, mixins
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.contrib.auth import get_user_model

from .invitation_authentication import InvitationAuthentication
from .models import Groups, Membership, Invitation
from .serializers import GroupsSerializer, MembershipSerializer, InvitationSerializer
import secrets
from .permissions import IsGroupAdmin, IsGroupMember, IsSelfOrAdmin
from expenses.models import GroupBalances


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
    permission_classes = [IsAuthenticated, IsGroupAdmin]

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated(), IsGroupMember()]
        return super().get_permissions()

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        un_settled_group = GroupBalances.objects.filter(group_id=instance).exclude(
            balance=0
        )
        if un_settled_group.exists():
            raise PermissionDenied("The Group is not settled yet")
        return super().perform_destroy(instance)


class MembersListCreateView(
    generics.GenericAPIView, mixins.ListModelMixin, mixins.CreateModelMixin
):
    queryset = Membership.objects.all()
    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated, IsGroupMember]

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
    permission_classes = [IsAuthenticated, IsGroupAdmin]

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated(), IsGroupMember()]
        if self.request.method == "PUT" or self.request.method == "PATCH":
            return [IsAuthenticated(), IsSelfOrAdmin()]
        return super().get_permissions()

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
        balance_obj = GroupBalances.objects.filter(
            group_id=member.group_id, member_id=member.id
        ).first()
        if balance_obj and balance_obj.balance != 0:
            raise ValidationError("Member cannot be deleted unless settled")

        return self.destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        Invitation.objects.filter(
            invited_email=instance.email, group_id=instance.group_id
        ).delete()

        return super().perform_destroy(instance)


class InvitationView(APIView):
    permission_classes = [IsAuthenticated, IsGroupAdmin]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        member = get_object_or_404(Membership, id=kwargs.get("id"))
        group = get_object_or_404(Groups, id=kwargs.get("pk"))
        token = secrets.token_urlsafe(75)
        invitation = {
            "invited_email": member.email,
            "group_id": group.id,
            "token": token,
            "invited_by": request.user.email,
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
        CLIENT_DOMAIN = settings.CLIENT_DOMAIN
        subject = f"You're invited to join {group} on Splitzy!"
        invited_email = invitation_details.get("invited_email")
        invited_by = invitation_details.get("invited_by")
        token = invitation_details.get("token")
        context = {
            "invited_email": invited_email,
            "group_name": group,
            "invitation_link": f"{CLIENT_DOMAIN}/accept-invitation/?token={token}",
            "invited_by": invited_by,  # replace it with invited_by_user
            "expiration_days": 7,  # adjust as needed
            "logo_url": f"{CLIENT_DOMAIN}/public/logo",
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
    permission_classes = [AllowAny]
    authentication_classes = [InvitationAuthentication]

    def post(self, request, *args, **kwargs):
        token = request.GET.get("token")

        if not token:
            return Response(
                {"detail": "Invitation token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            invitation_instance = Invitation.objects.get(token=token)
            if invitation_instance.status == "E":
                return Response(
                    {"detail": "Sorry, Token is expired"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if invitation_instance.status == "A":
                return Response(
                    {
                        "detail": "Sorry, Invitation is already accepted. Link is expired.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Invitation.DoesNotExist:
            return Response(
                {"detail": "Token not valid"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        group = invitation_instance.group_id
        email = invitation_instance.invited_email
        # check user is already in the system or not
        User = get_user_model()
        user = User.objects.filter(email=email).first()
        if not user:
            return Response(
                {
                    "code": "REGISTER_REQUIRED",
                    "detail": "Invited email is not registered. Please sign up.",
                    "invited_email": email,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not request.user.is_authenticated:
            return Response(
                {
                    "code": "AUTH_REQUIRED",
                    "detail": "Login or register to accept invitation.",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if request.user != user:
            return Response(
                {
                    "code": "WRONG_USER",
                    "detail": "You are logged in with another account. Logout and login with the invited email.",
                    "invited_email": email,
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        with transaction.atomic():
            member = get_object_or_404(Membership, group_id=group.id, email=email)
            member.user_id = user
            member.verified = True
            if not member.name:
                member.name = user.name
            member.save()
            invitation_instance.status = "A"
            invitation_instance.save()
            return Response(
                {
                    "code": "SUCCESS",
                    "detail": "Invitation accepted successfully.",
                },
                status=status.HTTP_200_OK,
            )


class RejectInvitationView(APIView):
    def post(self, request, *args, **kwargs):
        token = request.GET.get("token")
        if not token:
            return Response(
                {"detail": "Invitation token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invitation_instance = get_object_or_404(Invitation, token=token)
        if invitation_instance.status == "A":
            return Response(
                {"detail": "Invitation is already Accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invitation_instance.status = "E"
        invitation_instance.save()
        return Response(
            {
                "detail": "Invitation rejected successfully.",
            },
            status=status.HTTP_200_OK,
        )


class InvitationsForUserListView(generics.GenericAPIView, mixins.ListModelMixin):
    serializer_class = InvitationSerializer
    queryset = Invitation.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        return qs.filter(invited_email=user.email, status="P")

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
