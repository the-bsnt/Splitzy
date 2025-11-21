from rest_framework.views import APIView
from rest_framework import generics, mixins
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Expenses, ExpensesParticipants
from .serializers import ExpensesSerializer, ExpensesParticipantsSerializer


class ExpensesView(generics.GenericAPIView, mixins.CreateModelMixin):
    queryset = Expenses.objects.all()
    serializer_class = ExpensesSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

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
        print(balances)
        transactions = self.min_cash_flow(balances)
        print(transactions)

    def min_cash_flow(self, balances):
        """
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
            transactions.append({"from": debtor, "to": creditor, "amount": payment})

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


# create another table to record transactions
