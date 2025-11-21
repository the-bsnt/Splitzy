from django.contrib import admin

from .models import Expenses, ExpensesParticipants

admin.site.register(Expenses)
admin.site.register(ExpensesParticipants)
