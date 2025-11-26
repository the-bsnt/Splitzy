from django.db import models
import uuid
from groups.models import Groups, Membership


class Expenses(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    group_id = models.ForeignKey(Groups, on_delete=models.CASCADE)
    paid_by = models.ForeignKey(Membership, on_delete=models.CASCADE)
    title = models.CharField(max_length=50)
    description = models.TextField(blank=True, default="")
    amount = models.FloatField(default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title}- Amt= {self.amount}"


class ExpensesParticipants(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    expense_id = models.ForeignKey(Expenses, on_delete=models.CASCADE)
    member_id = models.ForeignKey(Membership, on_delete=models.CASCADE)
    paid_amt = models.FloatField(default=0.00)

    def __str__(self):
        return f"{self.expense_id.title}-{self.member_id}-share={self.paid_amt}"

    # edit the model to make split with percentage. for now split is equal here


class TransactionRecords(models.Model):
    """
    Model to record expected transactions as result of any expense.
    """

    TYPE = [("P", "Proposed"), ("A", "Actual")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    expense_id = models.ForeignKey(
        Expenses, on_delete=models.CASCADE, null=True, blank=True
    )
    debtor = models.ForeignKey(
        Membership, on_delete=models.CASCADE, related_name="payer"
    )
    creditor = models.ForeignKey(
        Membership, on_delete=models.CASCADE, related_name="receiver"
    )
    payment = models.FloatField(default=0.0)
    type = models.CharField(max_length=1, choices=TYPE, default="P", null=True)
    created_at = models.DateTimeField(
        auto_now_add=True, null=True
    )  # remove null after migration

    def __str__(self):
        return f" {self.debtor} ---> {self.creditor} || Amt = {self.payment}"

    """
    Debtor (Owes): The person who is expected to pay the money.
    Creditor (Is Owed): The person who is expected to receive the money.
    payment -> positive : debitor has to pay to creditor;
    """


class GroupBalances(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    group_id = models.ForeignKey(Groups, on_delete=models.CASCADE)
    member_id = models.ForeignKey(Membership, on_delete=models.CASCADE)
    balance = models.FloatField(default=0.0)

    @property
    def is_settled(self):
        return self.balance == 0

    def __str__(self):
        return f"G={self.group_id}|{self.member_id} --> {self.balance}"
