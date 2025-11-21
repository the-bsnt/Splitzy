from django.db import models
import uuid
from groups.models import Groups, Membership


class Expenses(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    group_id = models.ForeignKey(Groups, on_delete=models.CASCADE)
    paid_by = models.ForeignKey(Membership, on_delete=models.CASCADE)
    title = models.CharField(max_length=50, unique=True)
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
        return f"{self.expense_id.title}-{self.member_id}-share={self.share}"

    # edit the model to make split with percentage. for now split is equal


# class Transactions(models.Model):
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4)
#     debtor = models.ForeignKey(
#         Membership, on_delete=models.CASCADE, related_name="debtor_transactions"
#     )
#     creditor = models.ForeignKey(
#         Membership, on_delete=models.CASCADE, related_name="creditor_transactions"
#     )
#     payment = models.DecimalField(max_digits=9, decimal_places=2, default=0.00)

#     def __str__(self):
#         return f"from {self.debtor} to {self.creditor} : Amt = {self.payment}"


# Debtor (Owes): The person who is expected to pay the money.

# Creditor (Is Owed): The person who is expected to receive the money.

# payment -> positive : debitor has to pay to creditor;
# payment -> negative : debitor has over paid to creditor; so creditor have pay that amount to creditor to settle up.;
# payment -> 0 means settled
