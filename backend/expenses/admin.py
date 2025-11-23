from django.contrib import admin

from .models import Expenses, ExpensesParticipants, TransactionRecords, GroupBalances

admin.site.register(Expenses)
admin.site.register(ExpensesParticipants)
admin.site.register(TransactionRecords)
admin.site.register(GroupBalances)
