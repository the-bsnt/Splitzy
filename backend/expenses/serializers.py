from rest_framework import serializers
from .models import Expenses, ExpensesParticipants, TransactionRecords, GroupBalances

from groups.models import Groups, Membership
from django.shortcuts import get_object_or_404
from django.db import transaction


class ExpensesParticipantsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpensesParticipants
        fields = ["member_id", "paid_amt"]


class ExpensesSerializer(serializers.ModelSerializer):
    participants = ExpensesParticipantsSerializer(many=True, required=False)

    class Meta:
        model = Expenses
        fields = [
            "id",
            "title",
            "description",
            "paid_by",
            "amount",
            "participants",
            "created_at",
            "group_id",
        ]
        extra_kwargs = {
            "description": {"required": False},
            "id": {"read_only": True},
            "created_at": {"read_only": True},
            "group_id": {"read_only": True},
        }

    def validate(self, attrs):
        # to retrive group_id
        group_id = self.context.get("view").kwargs.get("pk")
        group = get_object_or_404(Groups, id=group_id)
        attrs["group_id"] = group
        participants = attrs.get("participants", [])
        if participants:
            for each in participants:
                member = each.get("member_id")
                # member_id becomes member instance after serialization
                if member.group_id != group:
                    raise serializers.ValidationError(
                        "Given Member Id is not a valid membership or is not a member of this group."
                    )
        amt = attrs.get("amount")

        if amt is not None:
            if amt <= 0:
                raise serializers.ValidationError("Amount must be greater than zero.")
        return super().validate(attrs)

    def create(self, validated_data):
        participants = validated_data.pop("participants", [])

        # create expense instance and participants if any
        with transaction.atomic():
            expense_instance = super().create(validated_data)
            if participants:
                total_paid = 0
                for individual in participants:
                    participant = ExpensesParticipants.objects.create(
                        expense_id=expense_instance,
                        **individual,
                    )
                    total_paid += participant.paid_amt
                expense_instance.amount = total_paid
                expense_instance.save()
        return expense_instance


class ExpensesDetailSerializer(serializers.ModelSerializer):

    participants = ExpensesParticipantsSerializer(
        many=True, source="expensesparticipants_set"
    )

    class Meta:
        model = Expenses
        fields = [
            "id",
            "group_id",
            "title",
            "description",
            "paid_by",
            "amount",
            "created_at",
            "participants",
        ]


class TransactionRecordsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionRecords
        fields = "__all__"

    def validate(self, attrs):
        if attrs.get("payment") == 0:
            raise serializers.ValidationError("You cannot record payment 0")
        return super().validate(attrs)


class GroupBalancesSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupBalances
        fields = "__all__"

    def create(self, validated_data):
        group = validated_data.pop("group_id")
        member = validated_data.pop("member_id")
        balance_instance, created = GroupBalances.objects.get_or_create(
            group_id=group, member_id=member, defaults={**validated_data}
        )
        if not created:
            balance_instance.balance += validated_data.get("balance")
        balance_instance.save()
        return balance_instance


class RecordPaymentSerializer(serializers.Serializer):
    debtor = serializers.UUIDField()  # payer
    creditor = serializers.UUIDField()  # receiver
    payment = serializers.FloatField()

    def validate(self, attrs):
        if attrs.get("payment") <= 0:
            raise serializers.ValidationError(
                {"payment": "Payment amount must be greater than 0."}
            )
        return super().validate(attrs)
