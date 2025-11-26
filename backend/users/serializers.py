from rest_framework import serializers


from .models import CustomUser


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "name", "password"]
        extra_kwargs = {
            "password": {"write_only": True},  # Ensures password is write-only
            "id": {"read_only": True},
        }

    def create(self, validated_data):
        validated_data["username"] = validated_data.get("email")
        psw = validated_data.pop("password")
        instance = super().create(validated_data)
        instance.set_password(psw)
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField()
