import React, { useState } from "react";
import Button from "./Button";
import { expenseService } from "../services/expenseService";
import { CircleDollarSignIcon } from "lucide-react";

const BalancesSection = ({
  groupId,
  members,
  balances,
  suggestedTransactions,
  loadGroupData,
  addNotification,
}) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const handleSettleTransaction = async (transaction) => {
    try {
      await expenseService.recordPayment(groupId, transaction);
      setSelectedTransaction(null);
      loadGroupData();
      addNotification("Transaction Settlement Successfull!", "success");
    } catch (error) {
      console.error("Error settling transaction:", error);
      addNotification("Transaction Settlement Failed!", "error");
    }
  };
  const getMemberObject = function (mId) {
    return members.find((m) => m.id == mId);
  };
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 mb-5">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <CircleDollarSignIcon className="w-5 h-5" />
          Group Balances
        </h2>
      </div>

      {/* Current Balances */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Current Balances
        </h3>
        <div className="space-y-3">
          {balances.map((balance) => (
            <div
              key={balance.member_id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <span className="font-medium text-gray-900">
                {getMemberObject(balance.member_id)?.name}
              </span>
              <span
                className={`font-semibold ${
                  balance.balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {" "}
                {balance.balance >= 0 ? "" : "-"}$
                {Math.abs(balance.balance).toFixed(2)}{" "}
                {balance.balance >= 0 ? "owed" : "owes"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Transactions */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Suggested Settlements
        </h3>
        <div className="space-y-3">
          {suggestedTransactions.map((transaction, index) => (
            <div
              key={index}
              onClick={() => setSelectedTransaction(transaction)}
              className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <div className="text-sm">
                <span className="font-medium text-gray-900">
                  {getMemberObject(transaction.debtor)?.name}
                </span>
                <span className="text-gray-600"> have to pay </span>
                <span className="font-medium text-gray-900">
                  {getMemberObject(transaction.creditor)?.name}
                </span>
              </div>
              <span className="font-semibold text-blue-600">
                ${transaction.payment.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement Confirmation Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Payment</h3>
            <div className="space-y-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-4 mb-3">
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {getMemberObject(selectedTransaction.debtor)?.name}
                    </div>
                    <div className="text-sm text-red-600">Pays</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      {getMemberObject(selectedTransaction.creditor)?.name}
                    </div>
                    <div className="text-sm text-green-600">Gets</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${selectedTransaction.payment.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </Button>
              <Button
                variant="green"
                onClick={() => handleSettleTransaction(selectedTransaction)}
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalancesSection;
