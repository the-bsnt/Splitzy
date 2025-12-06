from rest_framework.views import APIView
from rest_framework import generics, mixins
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404
from groups.models import Groups, Membership

from .models import (
    Expenses,
    ExpensesParticipants,
    ExpenseBalances,
    GroupBalances,
    TransactionRecords,
)
from .serializers import (
    ExpensesSerializer,
    ExpensesDetailSerializer,
    ExpenseBalanceSerializer,
    TransactionRecordsSerializer,
    GroupBalancesSerializer,
    RecordPaymentSerializer,
)

from groups.permissions import IsGroupMember, IsGroupAdmin, IsSelfOrAdmin


def min_cash_flow(balances):
    """
    Function takes balance dictionary and returns transactions list

    balance -> +ve means , others have to pay back to him
    balance -> -ve means , he has to pay others to him
    balance -> 0 means already settled
    """

    transactions = []
    # seperate the balances dict to creditors and debtors  and get list using list comprehension
    creditors = [(m, bal) for m, bal in balances.items() if bal > 0]
    debtors = [(m, -bal) for m, bal in balances.items() if bal < 0]

    # sort creditors and debtors in descending orders
    creditors.sort(key=lambda x: -x[1])  # -ve is for sorting in descending order
    debtors.sort(key=lambda x: -x[1])

    while creditors and debtors:
        # retrieve highest creditor and debitor
        creditor, credit_amt = creditors[0]
        debtor, debit_amt = debtors[0]

        # get minimum amount among credit and debit
        payment = min(credit_amt, debit_amt)
        # append to transactions list
        transactions.append(
            {"debtor": debtor, "creditor": creditor, "payment": payment}
        )

        # remove first tuples, update payment and reinsert if amt !=0 and sort lists again
        creditors = creditors[1:]
        debtors = debtors[1:]

        credit_amt -= payment
        debit_amt -= payment

        if credit_amt > 0:
            creditors.append((creditor, credit_amt))
            creditors.sort(key=lambda x: x[-1])

        if debit_amt > 0:
            debtors.append((debtor, debit_amt))
            debtors.sort(key=lambda x: x[-1])
    return transactions


class ExpensesView(
    generics.GenericAPIView, mixins.CreateModelMixin, mixins.ListModelMixin
):
    queryset = Expenses.objects.all()
    serializer_class = ExpensesSerializer
    permission_classes = [IsAuthenticated, IsGroupMember]

    def get_queryset(self):
        group_id = self.kwargs.get("pk")
        qs = super().get_queryset()
        return qs.filter(group_id=group_id)

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    @transaction.atomic
    def perform_create(self, serializer):
        expense_instance = serializer.save()
        balances = {}
        group = expense_instance.group_id
        participants = expense_instance.expensesparticipants_set.all()
        # split equally and all
        if not participants:
            members = group.membership_set.all()
            share = expense_instance.amount / members.count()
            for m in members:
                balances[m.id] = -share
            balances[expense_instance.paid_by.id] += expense_instance.amount
        # split between participants equally;
        else:
            share = expense_instance.amount / participants.count()
            for p in participants:
                balances[p.member_id.id] = p.paid_amt - share

        # record Expense Balances
        for m, bal in balances.items():
            data = {"expense_id": expense_instance.id, "member_id": m, "balance": bal}
            expense_balance_serializer = ExpenseBalanceSerializer(data=data)
            if expense_balance_serializer.is_valid(raise_exception=True):
                expense_balance_serializer.save()

        # to record Proposed Settlements
        transactions = min_cash_flow(balances)
        for t in transactions:
            t["expense_id"] = expense_instance.id
            # t["recorded_by"] = self.request.user.id (no need)
            settlement_serializer = TransactionRecordsSerializer(data=t)
            if settlement_serializer.is_valid(raise_exception=True):
                settlement_serializer.save()

        # to update group balances.
        for m, bal in balances.items():
            data = {"group_id": group.id, "member_id": m, "balance": bal}
            group_balance_serializer = GroupBalancesSerializer(data=data)
            if group_balance_serializer.is_valid(raise_exception=True):
                group_balance_serializer.save()


class ExpenseDetailView(
    generics.GenericAPIView, mixins.RetrieveModelMixin, mixins.UpdateModelMixin
):
    queryset = Expenses.objects.all()
    serializer_class = ExpensesDetailSerializer
    lookup_field = "id"
    permission_classes = [IsAuthenticated, IsGroupMember]

    def get_serializer_class(self):
        if self.request.method == "PUT":
            return ExpensesSerializer
        return super().get_serializer_class()

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    @transaction.atomic
    def perform_update(self, serializer):
        old_expense_instance = self.get_object()
        old_balances = self.get_old_balances(old_expense_instance)
        # reverse the sign of all balance values
        old_balances = {m_id: -bal for m_id, bal in old_balances.items()}

        # delete old transactions saved.
        TransactionRecords.objects.filter(expense_id=old_expense_instance.id).delete()

        new_instance = serializer.save()
        new_balances = self.get_balance_dict(new_instance)

        # create new Proposed transactions.
        transactions = min_cash_flow(new_balances)
        self.record_proposed_transactions(transactions, new_instance)

        # update Expense Balances
        self.update_expense_balance(old_expense_instance, new_balances)
        # update Group Balances;
        group = old_expense_instance.group_id
        self.update_group_balances(old_balances, group)
        self.update_group_balances(new_balances, group)

    def get_old_balances(self, expense_instance):
        old_balances = ExpenseBalances.objects.filter(expense_id=expense_instance)
        balance_dict = {obj.member_id.id: obj.balance for obj in old_balances}
        return balance_dict

    def update_expense_balance(self, expense_instance, new_balances):
        # delete balance for unsent participants
        existing_balances = [
            obj.member_id for obj in expense_instance.expensebalances_set.all()
        ]
        new_balances_list = list(new_balances.keys())
        for m in existing_balances:
            if m not in new_balances_list:
                ExpenseBalances.objects.filter(
                    expense_id=expense_instance, member_id=m
                ).delete()

        for m, bal in new_balances.items():
            data = {"expense_id": expense_instance.id, "member_id": m, "balance": bal}
            expense_balance_serializer = ExpenseBalanceSerializer(data=data)
            if expense_balance_serializer.is_valid(raise_exception=True):
                expense_balance_serializer.save()

    def record_proposed_transactions(self, transactions, expense_instance):
        for t in transactions:
            t["expense_id"] = expense_instance.id
            # t["recorded_by"] = self.request.user.id (no need)
            settlement_serializer = TransactionRecordsSerializer(data=t)
            if settlement_serializer.is_valid(raise_exception=True):
                settlement_serializer.save()

    def get_balance_dict(self, expense_instance):
        balances = {}
        group = expense_instance.group_id
        participants = expense_instance.expensesparticipants_set.all()
        # split equally and all
        if not participants:
            members = group.membership_set.all()
            share = expense_instance.amount / members.count()
            for m in members:
                balances[m.id] = -share
            balances[expense_instance.paid_by.id] += expense_instance.amount
        # split between participants equally;
        else:
            share = expense_instance.amount / participants.count()
            for p in participants:
                balances[p.member_id.id] = p.paid_amt - share
        return balances

    def update_group_balances(self, balances, group):
        for m, bal in balances.items():
            data = {
                "group_id": group.id,
                "member_id": m,
                "balance": bal,
            }
            group_balance_serializer = GroupBalancesSerializer(data=data)
            if group_balance_serializer.is_valid(raise_exception=True):
                group_balance_serializer.save()


class GroupBalanceView(generics.GenericAPIView, mixins.ListModelMixin):
    permission_classes = [IsAuthenticated, IsGroupMember]

    queryset = GroupBalances.objects.all()
    serializer_class = GroupBalancesSerializer

    def get(self, request, *args, **kwargs):
        response = self.list(request, *args, **kwargs)
        if response.status_code == 200:
            # balance is converted to string due to frontend issue
            balance_list = [
                {**b, "balance": str(b.get("balance"))} for b in response.data
            ]

            return Response(balance_list, status=status.HTTP_200_OK)
        return response

    def get_queryset(self):
        gid = self.kwargs.get("pk")
        qs = super().get_queryset()
        return qs.filter(group_id=gid)


class SuggestedSettlementsView(APIView):
    permission_classes = [IsAuthenticated, IsGroupMember]

    def get(self, request, *args, **kwargs):
        group_id = kwargs.get("pk")
        get_object_or_404(Groups, id=group_id)
        balance_qs = GroupBalances.objects.filter(group_id=group_id)
        balances = {obj.member_id.id: obj.balance for obj in balance_qs}
        settlements = min_cash_flow(balances)
        return Response(settlements, status=status.HTTP_200_OK)


class RecordPaymentView(APIView):
    permission_classes = [IsAuthenticated, IsGroupMember]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        usr = request.user
        group = get_object_or_404(Groups, id=kwargs.get("pk"))
        serializer = RecordPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payer = serializer.data.get("debtor")
        receiver = serializer.data.get("creditor")
        payment = serializer.data.get("payment")

        # update transcation record table
        t = {
            "debtor": payer,
            "creditor": receiver,
            "payment": payment,
            "group_id": group.id,
            "recorded_by": usr.id,
            "type": "A",
        }
        transaction_serializer = TransactionRecordsSerializer(data=t)
        transaction_serializer.is_valid(raise_exception=True)
        transaction_serializer.save()

        # update group balance table
        record_list = [
            {"group_id": group.id, "member_id": payer, "balance": payment},
            {
                "group_id": group.id,
                "member_id": receiver,
                "balance": -payment,
            },
        ]
        for r in record_list:
            balance_serializer = GroupBalancesSerializer(data=r)
            balance_serializer.is_valid(raise_exception=True)
            balance_serializer.save()

        return Response(
            {"detail": "Payment Recorded Successfully"},
            status=status.HTTP_200_OK,
        )


class TransactionRecordsView(generics.GenericAPIView, mixins.ListModelMixin):
    permission_classes = [IsAuthenticated, IsGroupMember]

    queryset = TransactionRecords.objects.all()
    serializer_class = TransactionRecordsSerializer
    lookup_field = "id"

    def get_queryset(self):
        expense_id = self.kwargs.get("id")
        qs = super().get_queryset()
        return qs.filter(expense_id=expense_id)

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)


class GroupTransactionHistoryView(generics.GenericAPIView, mixins.ListModelMixin):
    permission_classes = [IsAuthenticated, IsGroupMember]

    queryset = TransactionRecords.objects.all()
    serializer_class = TransactionRecordsSerializer
    lookup_field = "pk"

    def get_queryset(self):
        group_id = self.kwargs.get("pk")
        qs = super().get_queryset()
        return qs.filter(group_id=group_id, type="A")

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
