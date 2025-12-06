import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { expenseService } from "../services/expenseService";
import { groupService } from "../services/groupService";
import Button from "../components/Button";
import ErrorMessage from "../components/ErrorMessage";
import { useError } from "../hooks/useError";

const ExpenseDetail = () => {
  const location = useLocation();
  const { groupId, expenseId, groupName } = location.state || {};
  //   const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);
  const { error: error, setError, clearError } = useError();

  const [proposedTransactions, setProposedTransactions] = useState([]);

  useEffect(() => {
    const fetchExpenseDetail = async () => {
      try {
        setLoading(true);
        const expenseRes = await expenseService.getExpense(groupId, expenseId);
        setExpense(expenseRes.data);
      } catch (err) {
        setError("Failed to fetch expense details");
        // console.error("Error fetching expense:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseDetail();
  }, [groupId, expenseId]);

  useEffect(() => {
    const fetchProposedTransactions = async () => {
      try {
        setLoading(true);
        const tRes = await expenseService.proposedTransactions(
          groupId,
          expenseId
        );
        setProposedTransactions(tRes.data);
      } catch (err) {
        setError("Failed to fetch Proposed Transactions.");
      } finally {
        setLoading(false);
      }
    };
    fetchProposedTransactions();
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const memberRes = await groupService.getMembers(groupId);
        setMembers(memberRes.data);
      } catch (err) {
        setError("Failed to fetch participants.");
      } finally {
        setLoading(false);
      }
    };
    // fetchGroupDetails();
    fetchMembers();
  }, []);
  //function to get memberobject
  const getMemberObject = function (mId) {
    return members.find((m) => m.id == mId);
  };
  //function to get balance of each participant  ;
  const getBalance = function (amt) {
    return (amt - expense.amount / expense.participants?.length).toFixed();
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Loading expense details...</div>
      </div>
    );
  }

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ErrorMessage
          error={error}
          onDismiss={clearError}
          autoDismiss={true}
          dismissTime={5000}
        />
      </div>
    );

  if (!expense) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Expense not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="border-b pb-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">{expense.title}</h1>

          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              expense.is_settled
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {expense.is_settled ? "Settled" : "Not Settled"}
          </span>
        </div>

        {expense.description && (
          <p className="text-gray-600 mt-2">{expense.description}</p>
        )}
      </div>

      {/* Main Expense Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Amount
            </label>
            <p className="text-2xl font-bold text-red-600">
              ${parseFloat(expense.amount).toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Paid By
            </label>
            <p className="text-lg font-semibold text-gray-800">
              {getMemberObject(expense.paid_by)?.name}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Created Date
            </label>
            <p className="text-lg text-gray-800">
              {new Date(expense.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Group:
            </label>
            <p className="text-lg text-gray-800">{groupName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Added By:
            </label>
            <p className="text-lg text-gray-800">{expense.added_by_name}</p>
          </div>
        </div>
      </div>

      {/* Participants Section */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Participants ({expense.participants?.length || 0})
        </h2>

        {expense.participants && expense.participants.length > 0 ? (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balances
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expense.participants.map((participant, index) => (
                  <tr
                    key={participant.id || index}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getMemberObject(participant.member_id)?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${parseFloat(participant.paid_amt || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-justify">
                        <div
                          className={`text-sm font-mono font-bold ${
                            getBalance(participant.paid_amt) > 0
                              ? "text-green-600"
                              : getBalance(participant.paid_amt) < 0
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                        >
                          {getBalance(participant.paid_amt) >= 0 ? "+" : "-"}$
                          {Math.abs(getBalance(participant.paid_amt)).toFixed(
                            2
                          )}
                        </div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide">
                          {getBalance(participant.paid_amt) > 0
                            ? "Credit Balance"
                            : getBalance(participant.paid_amt) < 0
                            ? "Debit Balance"
                            : "Zero Balance"}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              All members are participants in this group.
            </p>
          </div>
        )}
      </div>
      {/* Proposed Transactions Section */}
      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Proposed Settlements
          </h2>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            {proposedTransactions.length} transactions
          </span>
        </div>

        {proposedTransactions.length > 0 ? (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debtor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creditor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-justify text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proposedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(transaction.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">
                        {getMemberObject(transaction.debtor)?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {getMemberObject(transaction.creditor)?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-blue-600">
                        {parseFloat(transaction.payment).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === "P"
                            ? "bg-purple-100 text-purple-800"
                            : transaction.type === "C"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {transaction.type === "P"
                          ? "Proposed"
                          : transaction.type === "A"
                          ? "Actual"
                          : transaction.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-gray-500 mb-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <p className="text-gray-500">No Proposed settlements found.</p>
            <p className="text-sm text-gray-400 mt-1">
              Settlement suggestions will appear here when available.
            </p>
          </div>
        )}

        {/* Summary Statistics */}
        {proposedTransactions.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-800">
                Proposed Settlements
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {proposedTransactions.length}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-800">
                Total Amount to be Settled
              </div>
              <div className="text-2xl font-bold text-green-900">
                {parseFloat(
                  proposedTransactions
                    .reduce(
                      (sum, transaction) =>
                        sum + parseFloat(transaction.payment),
                      0
                    )
                    .toFixed(2)
                )}
              </div>
            </div>
            {/* <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-purple-800">
                proposed
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {proposedTransactions.filter((t) => t.type === "P").length}
              </div>
            </div> */}
          </div>
        )}
      </div>
      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
        <Button variant="ghost" onClick={() => window.history.back()}>
          Back
        </Button>
        <Button
          variant="red"
          onClick={() => {
            // Add edit functionality here
            console.log("Edit expense:", expense.id);
          }}
        >
          Edit Expense
        </Button>
      </div>
    </div>
  );
};

export default ExpenseDetail;
