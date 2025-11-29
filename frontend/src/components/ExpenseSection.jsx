import React, { useState, useEffect } from "react";
import Button from "./Button";
import { expenseService } from "../services/expenseService";
import { NavLink } from "react-router-dom";

const ExpenseSection = ({
  currentUser,
  expenses,
  members,
  onAddExpense,
  onRecordPayment,
  groupName,
}) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expandedExpense, setExpandedExpense] = useState(null);
  const [expenseDetails, setExpenseDetails] = useState({});
  const [includeParticipants, setIncludeParticipants] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: "",
    description: "",
    amount: "",
    paid_by: "",
    participants: [],
  });

  // Reset participants when paid_by changes or when includeParticipants is toggled
  useEffect(() => {
    if (includeParticipants && newExpense.paid_by) {
      // Set paid_by member as default participant
      const paidByMember = members.find((m) => m.id === newExpense.paid_by);
      if (
        paidByMember &&
        !newExpense.participants.some((p) => p.member_id === newExpense.paid_by)
      ) {
        setNewExpense((prev) => ({
          ...prev,
          participants: [
            {
              member_id: newExpense.paid_by,
              paid_amt: "",
            },
          ],
        }));
      }
    } else if (!includeParticipants) {
      setNewExpense((prev) => ({
        ...prev,
        participants: [],
      }));
    }
  }, [includeParticipants, newExpense.paid_by, members]);

  const handleAddExpense = async () => {
    // Validation
    if (!newExpense.title || !newExpense.paid_by) {
      alert("Please fill in required fields");
      return;
    }

    if (!includeParticipants && !newExpense.amount) {
      alert("Please enter an amount");
      return;
    }

    if (includeParticipants && newExpense.participants.length === 0) {
      alert("Please select at least one participant");
      return;
    }

    const expenseData = {
      title: newExpense.title,
      description: newExpense.description,
      paid_by: newExpense.paid_by,
    };

    // Only add amount if not using custom participants or if amount is provided
    if (newExpense.amount) {
      expenseData.amount = parseFloat(newExpense.amount);
    }

    // Only add participants if user chose to include them
    if (includeParticipants && newExpense.participants.length > 0) {
      expenseData.participants = newExpense.participants
        .filter((p) => p.paid_amt) // Only include participants with paid_amt
        .map((p) => ({
          member_id: p.member_id,
          paid_amt: parseFloat(p.paid_amt),
        }));
    }

    await onAddExpense(expenseData);

    // Reset form
    setNewExpense({
      title: "",
      description: "",
      amount: "",
      paid_by: "",
      participants: [],
    });
    setIncludeParticipants(false);
    setShowAddExpense(false);
  };

  const handleParticipantToggle = (memberId) => {
    setNewExpense((prev) => {
      const exists = prev.participants.some((p) => p.member_id === memberId);

      if (exists) {
        // Remove participant (but don't allow removing paid_by member)
        if (memberId === prev.paid_by) return prev;
        return {
          ...prev,
          participants: prev.participants.filter(
            (p) => p.member_id !== memberId
          ),
        };
      } else {
        // Add participant
        return {
          ...prev,
          participants: [
            ...prev.participants,
            { member_id: memberId, paid_amt: "" },
          ],
        };
      }
    });
  };

  const handleParticipantAmountChange = (memberId, amount) => {
    setNewExpense((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.member_id === memberId ? { ...p, paid_amt: amount } : p
      ),
    }));
  };

  const getMemberObject = function (mId) {
    return members.find((m) => m.id == mId);
  };

  // expenses.forEach((element) => {
  //   console.log(element);
  // });
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Section Header */}
      <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
      <div className="flex justify-end items-center mb-6 mt-4">
        <div className="flex space-x-3">
          <Button variant="green" onClick={() => onRecordPayment()}>
            Record Payment
          </Button>
          <Button
            variant="red"
            onClick={() => setShowAddExpense(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div
              className="flex justify-between items-center p-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={async () => {
                if (expandedExpense === expense.id) {
                  setExpandedExpense(null);
                } else {
                  setExpandedExpense(expense.id);

                  // Fetch full expense details and update the ExpenseDetails array
                  const res = await expenseService.getExpense(
                    expense.group_id,
                    expense.id
                  );
                  setExpenseDetails(res.data);
                }
              }}
            >
              <div className="flex items-center space-x-4 flex-1 gap-0.1">
                <div className="text-sm text-gray-800 min-w-20 bg-amber-100 p-1 rounded-sm">
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(expense.created_at))}
                </div>
                <span className="font-medium text-gray-900 flex-1 ">
                  {expense.title}
                </span>
                <span className="text-sm text-gray-600">
                  {getMemberObject(expense.paid_by)?.user_id == currentUser?.id
                    ? "You"
                    : getMemberObject(expense.paid_by)?.name}{" "}
                  paid
                </span>
                <span className="font-semibold text-gray-900">
                  ${expense.amount}
                </span>
              </div>
              <span className="text-gray-400">
                {expandedExpense === expense.id ? "▲" : "▼"}
              </span>
            </div>

            {expandedExpense === expense.id && (
              <div className="p-4 bg-gray-50 border-t border-gray-200 relative pb-10">
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Description:</span>{" "}
                  {expense.description}
                </p>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-2 bg-gray-100 border-b border-gray-200">
                    <div className="px-4 py-2 font-medium text-gray-900">
                      Participants
                    </div>
                    <div className="px-4 py-2 font-medium text-gray-900 text-right border-l border-gray-200">
                      Shares
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {expenseDetails.participants == null ||
                    expenseDetails.participants.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-600 text-center col-span-2 italic">
                        All members are participants
                      </div>
                    ) : (
                      expenseDetails.participants?.map((participant, index) => (
                        <div
                          key={participant.member_id}
                          className={`grid grid-cols-2 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <div className="px-4 py-3 text-sm text-gray-700">
                            {getMemberObject(participant.member_id)?.name}
                          </div>
                          <div className="px-4 py-3 text-sm font-medium text-gray-900 text-right border-l border-gray-200">
                            ${participant.paid_amt.toFixed(2)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <NavLink
                  to={`expense/${expense.title}`}
                  state={{
                    groupId: expense.group_id,
                    expenseId: expense.id,
                    groupName: groupName,
                  }}
                  className={
                    "p-2 absolute bottom-2 right-2 text-blue-600 hover:text-blue-800 text-sm underline underline-offset-2 hover:no-underline transition-all duration-200"
                  }
                >
                  More details
                </NavLink>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Expense</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="Expense title"
                  value={newExpense.title}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Expense description"
                  value={newExpense.description}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      description: e.target.value,
                    })
                  }
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid By *
                </label>
                <select
                  value={newExpense.paid_by}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, paid_by: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select who paid</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle for custom participants */}
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="includeParticipants"
                  checked={includeParticipants}
                  onChange={(e) => setIncludeParticipants(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="includeParticipants"
                  className="text-sm font-medium text-gray-700"
                >
                  Specify custom participants and their share amounts
                </label>
              </div>

              {/* Show amount field only if not using custom participants */}
              {!includeParticipants && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onWheel={(e) => e.target.blur()}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Custom participants section */}
              {includeParticipants && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Participants</h4>
                  <p className="text-sm text-gray-600">
                    Select participants and specify their share amounts. Total
                    amount is optional.
                  </p>

                  {/* Optional total amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Amount (optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newExpense.amount}
                      onWheel={(e) => e.target.blur()}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, amount: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {members.map((member) => {
                      const participant = newExpense.participants.find(
                        (p) => p.member_id === member.id
                      );
                      const isSelected = !!participant;
                      const isPaidBy = member.id === newExpense.paid_by;

                      return (
                        <div
                          key={member.id}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleParticipantToggle(member.id)}
                            disabled={isPaidBy}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="flex-1 text-sm text-gray-700">
                            {member.name || member.email}
                            {isPaidBy && (
                              <span className="ml-2 text-xs text-blue-600 font-medium">
                                (Payer)
                              </span>
                            )}
                          </span>
                          {isSelected && (
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={participant.paid_amt}
                              onChange={(e) =>
                                handleParticipantAmountChange(
                                  member.id,
                                  e.target.value
                                )
                              }
                              onWheel={(e) => e.target.blur()}
                              className="w-32 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExpense(false);
                    setIncludeParticipants(false);
                    setNewExpense({
                      title: "",
                      description: "",
                      amount: "",
                      paid_by: "",
                      participants: [],
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <Button
                  variant="red"
                  onClick={handleAddExpense}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Expense
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseSection;
