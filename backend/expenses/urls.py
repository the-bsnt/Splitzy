from django.urls import path

from .views import (
    ExpensesView,
    GroupBalanceView,
    RecordPaymentView,
    ExpenseDetailView,
    SuggestedSettlementsView,
    TransactionRecordsView,
    GroupTransactionHistoryView,
)

app_name = "expenses"
urlpatterns = [
    path(
        "groups/<uuid:pk>/expenses/", ExpensesView.as_view(), name="expense-list-create"
    ),
    path(
        "groups/<uuid:pk>/expenses/<uuid:id>/",
        ExpenseDetailView.as_view(),
        name="expense-create-update",
    ),
    path("groups/<uuid:pk>/balances/", GroupBalanceView.as_view(), name="balances"),
    path(
        "groups/<uuid:pk>/suggested-settlements/",
        SuggestedSettlementsView.as_view(),
        name="suggested-settlements",
    ),
    path(
        "groups/<uuid:pk>/settlement/",
        RecordPaymentView.as_view(),
        name="record-payment",
    ),
    path(
        "groups/<uuid:pk>/expenses/<uuid:id>/transactions/",
        TransactionRecordsView.as_view(),
        name="transaction-records",
    ),
    path(
        "groups/<uuid:pk>/transaction/history/",
        GroupTransactionHistoryView.as_view(),
        name="group-transaction-history",
    ),
]
