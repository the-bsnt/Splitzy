from django.contrib import admin

from .models import Expenses, ExpensesParticipants, ProposedSettlements, GroupBalances

admin.site.register(Expenses)
admin.site.register(ExpensesParticipants)
admin.site.register(ProposedSettlements)
admin.site.register(GroupBalances)
