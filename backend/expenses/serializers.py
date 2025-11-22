from rest_framework import serializers
from .models import Expenses, ExpensesParticipants, ProposedSettlements, GroupBalances

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
        fields = ["title", "description", "paid_by", "amount", "participants"]
        extra_kwargs = {"description": {"required": False}}

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


class ProposedSettlementsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProposedSettlements
        fields = "__all__"


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
