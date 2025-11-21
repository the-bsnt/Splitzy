from django.urls import path

from .views import ExpensesView

app_name = "expenses"
urlpatterns = [
    path("groups/<uuid:pk>/expenses/", ExpensesView.as_view(), name="expense-create"),
]
