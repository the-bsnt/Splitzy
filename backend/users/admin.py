from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm

# models
from .models import CustomUser


# user creation form for custom user
class CustomUserCreationForm(UserCreationForm):
    model = CustomUser
    fields = ["email", "name", "password1", "password2"]


# Register your models here.
class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    model = CustomUser
    list_display = ("username", "email", "name", "is_staff", "created_at")
    fieldsets = UserAdmin.fieldsets + (("Name", {"fields": ("name",)}),)
    add_fieldsets = (
        ("ADD USER", {"fields": ("email", "name", "password1", "password2")}),
    )


admin.site.register(CustomUser, CustomUserAdmin)

