from django.urls import path

from .views import ExpensesView, GroupBalanceView

app_name = "expenses"
urlpatterns = [
    path("groups/<uuid:pk>/expenses/", ExpensesView.as_view(), name="expense-create"),
    path("groups/<uuid:pk>/balances/", GroupBalanceView.as_view(), name="balances"),
]
