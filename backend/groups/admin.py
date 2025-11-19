from django.contrib import admin
from .models import Groups, Membership, Invitation

# Register your models here.
admin.site.register(Groups)
admin.site.register(Membership)
admin.site.register(Invitation)
