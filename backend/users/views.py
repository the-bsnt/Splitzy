from rest_framework.views import APIView
from rest_framework import generics, mixins
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError

# third party import
from rest_framework_simplejwt.tokens import RefreshToken

# userdefined imports
from .serializers import CustomUserSerializer, PasswordChangeSerializer


# user model
User = get_user_model()


# Create your views here.
class RegisterView(APIView):
    permission_classes = []

    def post(self, request, *args, **kwargs):
        try:
            serializer = CustomUserSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                usr = serializer.save()
                refresh = RefreshToken.for_user(usr)
                return Response(
                    {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                    },
                    status=status.HTTP_202_ACCEPTED,
                )
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeView(APIView):
    def patch(self, request, *args, **kwargs):
        try:
            serializer = PasswordChangeSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                old_password = serializer.data.get("old_password")
                new_password = serializer.data.get("new_password")
                try:
                    token = RefreshToken(
                        serializer.data.get("refresh")
                    )  # RefreshToken takes base64_encoded_token_string , Parses it (encoded refresh token string) into a RefreshToken object
                    print(token)
                except:
                    raise ValueError("Token invalid")
                user = request.user
                if user.check_password(old_password):
                    token.blacklist()  # first blacklisting the refresh token
                    user.set_password(new_password)
                    user.save()
                    return Response(
                        {"detail": "Password Reset Successfull!"},
                        status=status.HTTP_200_OK,
                    )
                return Response(
                    {"detail": "Old password Unmatched!"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            return Response(
                {"detail": f"Error occured: {e}"}, status=status.HTTP_400_BAD_REQUEST
            )


class ProfileView(
    generics.GenericAPIView, mixins.RetrieveModelMixin, mixins.UpdateModelMixin
):
    queryset = User.objects.all()
    serializer_class = CustomUserSerializer

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        pass

    def get_object(self):
        return self.request.user
