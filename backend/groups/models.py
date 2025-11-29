from django.db import models
import uuid
from users.models import CustomUser


class Groups(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(null=False, unique=True)
    description = models.TextField(null=True, blank=True)
    admin = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="expense_groups"
    )  # here admin should be transfered if admin is deleted??? for now group is deleted if admin is deleted.
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Membership(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(null=True)
    email = models.EmailField()
    group_id = models.ForeignKey(Groups, on_delete=models.CASCADE)
    user_id = models.ForeignKey(
        CustomUser, null=True, blank=True, on_delete=models.CASCADE
    )  # if verified user is deleted (set user deleted) then memeber is also delete (fix this if you require : this is remainder only)
    verified = models.BooleanField(default=False)
    # @property
    # def verified(self):
    #     if self.user_id is not

    def __str__(self):
        return f"{self.email}|G={self.group_id.name}"


class Invitation(models.Model):
    STATUS = [
        ("P", "Pending"),
        ("A", "Accepted"),
        ("E", "Expired"),
    ]
    invited_email = models.EmailField()
    group_id = models.ForeignKey(Groups, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=1, choices=STATUS, default="P")
    invited_by = models.EmailField(null=True)  # you can remove null later
    # add created_at field(optional)

    def __str__(self):
        return f"{self.group_id}-{self.invited_email}-{self.status}"
