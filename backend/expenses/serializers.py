from rest_framework import serializers
from .models import (
    Expenses,
    ExpensesParticipants,
    TransactionRecords,
    GroupBalances,
    ExpenseBalances,
)

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
        instance = getattr(self, "instance", None)  # in the case of update
        attrs["group_id"] = group
        attrs["added_by"] = self.context.get("request", None).user

        if (
            Expenses.objects.filter(group_id=group.id, title=attrs.get("title"))
            .exclude(pk=getattr(instance, "pk", None))
            .exists()
        ):
            raise serializers.ValidationError(
                "Expense with given title already exists in the group"
            )

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

    def update(self, instance, validated_data):
        participants = validated_data.pop("participants", [])
        with transaction.atomic():
            instance.paid_by = validated_data.get("paid_by", instance.paid_by)
            instance.title = validated_data.get("title", instance.title)
            instance.description = validated_data.get(
                "description", instance.description
            )
            instance.amount = validated_data.get("amount", instance.amount)

            # get existing participants member_ids and new coming participnats member ids
            existing_participants = [
                p.member_id for p in instance.expensesparticipants_set.all()
            ]

            new_participants = [p.get("member_id") for p in participants]

            # delete the unsent participants
            for m_id in existing_participants:
                if m_id not in new_participants:
                    ExpensesParticipants.objects.filter(
                        expense_id=instance, member_id=m_id
                    ).delete()
            if participants:
                total_paid = 0
                for individual in participants:
                    participant, created = ExpensesParticipants.objects.get_or_create(
                        expense_id=instance,
                        member_id=individual.pop("member_id"),
                        defaults={**individual},
                    )

                    if not created:
                        participant.paid_amt = individual.get("paid_amt")
                        participant.save()

                    total_paid += participant.paid_amt
                instance.amount = total_paid
            instance.save()

        return instance


class ExpensesDetailSerializer(serializers.ModelSerializer):

    participants = ExpensesParticipantsSerializer(
        many=True, source="expensesparticipants_set"
    )
    added_by_name = serializers.SerializerMethodField()

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
            "added_by",
            "added_by_name",
            "is_settled",
            "participants",
        ]

    def get_added_by_name(self, obj):
        return obj.added_by.name


class ExpenseBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseBalances
        fields = "__all__"

    def create(self, validated_data):
        expense_instance = validated_data.pop("expense_id")
        member_instance = validated_data.pop("member_id")

        instance, created = ExpenseBalances.objects.get_or_create(
            expense_id=expense_instance,
            member_id=member_instance,
            defaults={**validated_data},
        )
        if not created:
            instance.balance = validated_data.get("balance")
            instance.save()
        return instance


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
        # Using tolerance comparison to tolerate tiny numbers which are equivalent to zero to solve classic floating-point representation error. 0.64+4e ~=0
        if abs(balance_instance.balance) < 0.00001:
            balance_instance.balance = 0
        balance_instance.save()
        return balance_instance

    # def update(self, instance, validated_data):
    #     return super().update(instance, validated_data)


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
