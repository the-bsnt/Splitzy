import React, { useState, useEffect } from "react";
import Button from "./Button";
import { expenseService } from "../services/expenseService";
import { NavLink } from "react-router-dom";
import { CheckCircle, DollarSign, PlusCircle, Receipt } from "lucide-react";

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

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    title: "",
    paid_by: "",
    amount: "",
    participants: "",
  });

  // When custom participants toggle is enabled/disabled
  useEffect(() => {
    if (includeParticipants && newExpense.paid_by) {
      // Ensure payer is in participants when custom participants is enabled
      const payerInParticipants = newExpense.participants.find(
        (p) => p.member_id === newExpense.paid_by
      );

      if (!payerInParticipants) {
        // Add payer to participants with 0 amount
        setNewExpense((prev) => ({
          ...prev,
          participants: [
            ...prev.participants,
            {
              member_id: newExpense.paid_by,
              paid_amt: 0,
            },
          ],
        }));
      }
    }
  }, [includeParticipants]);

  // When paid_by changes
  useEffect(() => {
    if (includeParticipants && newExpense.paid_by) {
      const payerInParticipants = newExpense.participants.find(
        (p) => p.member_id === newExpense.paid_by
      );

      if (!payerInParticipants) {
        // Add payer to participants
        setNewExpense((prev) => ({
          ...prev,
          participants: [
            ...prev.participants,
            {
              member_id: newExpense.paid_by,
              paid_amt: 0,
            },
          ],
        }));
      } else {
        // Ensure payer's amount is not duplicated
        // Check if payer appears more than once
        const payerEntries = newExpense.participants.filter(
          (p) => p.member_id === newExpense.paid_by
        );

        if (payerEntries.length > 1) {
          // Remove duplicates, keep only the first one
          const seen = new Set();
          const uniqueParticipants = newExpense.participants.filter((p) => {
            if (p.member_id === newExpense.paid_by) {
              if (seen.has(p.member_id)) {
                return false;
              }
              seen.add(p.member_id);
              return true;
            }
            return true;
          });

          setNewExpense((prev) => ({
            ...prev,
            participants: uniqueParticipants,
          }));
        }
      }
    }
  }, [newExpense.paid_by, includeParticipants]);

  const validateForm = () => {
    const errors = {
      title: "",
      paid_by: "",
      amount: "",
      participants: "",
    };

    let isValid = true;

    // Validate title
    if (!newExpense.title.trim()) {
      errors.title = "Title is required";
      isValid = false;
    }

    // Validate paid_by
    if (!newExpense.paid_by) {
      errors.paid_by = "Please select who paid";
      isValid = false;
    }

    // Validate amount (if not using custom participants)
    if (!includeParticipants) {
      if (!newExpense.amount) {
        errors.amount = "Amount is required";
        isValid = false;
      } else if (parseFloat(newExpense.amount) <= 0) {
        errors.amount = "Amount must be greater than 0";
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleAddExpense = async () => {
    // Clear previous errors
    setValidationErrors({
      title: "",
      paid_by: "",
      amount: "",
      participants: "",
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    const expenseData = {
      title: newExpense.title,
      description: newExpense.description,
      paid_by: newExpense.paid_by,
    };

    // Include amount if not using custom participants
    if (!includeParticipants) {
      expenseData.amount = parseFloat(newExpense.amount);
    } else {
      // Remove duplicate participants before sending
      const uniqueParticipants = [];
      const seenMemberIds = new Set();

      newExpense.participants.forEach((p) => {
        if (!seenMemberIds.has(p.member_id)) {
          seenMemberIds.add(p.member_id);
          uniqueParticipants.push({
            member_id: p.member_id,
            paid_amt: parseFloat(p.paid_amt) || 0,
          });
        }
      });

      expenseData.participants = uniqueParticipants;

      // Include amount if provided (optional)
      if (newExpense.amount) {
        expenseData.amount = parseFloat(newExpense.amount);
      }
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
    const isPaidBy = memberId === newExpense.paid_by;
    if (isPaidBy) return; // Don't allow toggling the payer

    const existingIndex = newExpense.participants.findIndex(
      (p) => p.member_id === memberId
    );

    const updatedParticipants = [...newExpense.participants];

    if (existingIndex >= 0) {
      // Remove participant
      updatedParticipants.splice(existingIndex, 1);
    } else {
      // Add participant with 0 amount
      updatedParticipants.push({
        member_id: memberId,
        paid_amt: 0,
      });
    }

    setNewExpense({
      ...newExpense,
      participants: updatedParticipants,
    });
  };

  const handleParticipantAmountChange = (memberId, value) => {
    // Handle empty string
    if (value === "") {
      const updatedParticipants = newExpense.participants.map((p) => {
        if (p.member_id === memberId) {
          return { ...p, paid_amt: "" };
        }
        return p;
      });

      setNewExpense({
        ...newExpense,
        participants: updatedParticipants,
      });
      return;
    }

    // Convert to number, handle decimals properly
    const numValue = parseFloat(value);
    const amount = isNaN(numValue) ? 0 : numValue;

    // First, remove any duplicates for this member
    const seen = new Set();
    const deduplicatedParticipants = newExpense.participants.filter((p) => {
      if (p.member_id === memberId) {
        if (seen.has(p.member_id)) {
          return false;
        }
        seen.add(p.member_id);
        return true;
      }
      return true;
    });

    // Now update the amount for this member
    const updatedParticipants = deduplicatedParticipants.map((p) => {
      if (p.member_id === memberId) {
        return { ...p, paid_amt: amount };
      }
      return p;
    });

    setNewExpense({
      ...newExpense,
      participants: updatedParticipants,
    });
  };

  // Format amount input for display (show empty string for empty/0)
  const formatAmountForDisplay = (amount, memberId) => {
    if (amount === "" || amount === 0 || amount === "0" || amount === 0.0) {
      return "";
    }
    return amount.toString();
  };

  const getMemberObject = function (mId) {
    return members.find((m) => m.id == mId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Expenses
          </h2>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">Track & Manage</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex justify-end items-center gap-3">
          <Button
            variant="green"
            onClick={() => onRecordPayment()}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md group"
          >
            <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Record Payment
          </Button>
          <Button
            variant="red"
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md group"
          >
            <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" />
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
              {/* Title Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="Expense title"
                  value={newExpense.title}
                  onChange={(e) => {
                    setNewExpense({ ...newExpense, title: e.target.value });
                    if (validationErrors.title) {
                      setValidationErrors((prev) => ({ ...prev, title: "" }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.title
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.title}
                  </p>
                )}
              </div>

              {/* Description Field */}
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

              {/* Paid By Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid By *
                </label>
                <select
                  value={newExpense.paid_by}
                  onChange={(e) => {
                    const paidByValue = e.target.value;
                    setNewExpense({ ...newExpense, paid_by: paidByValue });
                    if (validationErrors.paid_by) {
                      setValidationErrors((prev) => ({ ...prev, paid_by: "" }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.paid_by
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                >
                  <option value="">Select who paid</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email}
                    </option>
                  ))}
                </select>
                {validationErrors.paid_by && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.paid_by}
                  </p>
                )}
              </div>

              {/* Toggle for custom participants */}
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="includeParticipants"
                  checked={includeParticipants}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setIncludeParticipants(isChecked);
                    if (!isChecked) {
                      // Clear participants when disabling custom participants
                      setNewExpense((prev) => ({
                        ...prev,
                        participants: [],
                      }));
                    } else if (newExpense.paid_by) {
                      // Add payer when enabling custom participants
                      const payerInParticipants = newExpense.participants.find(
                        (p) => p.member_id === newExpense.paid_by
                      );

                      if (!payerInParticipants) {
                        setNewExpense((prev) => ({
                          ...prev,
                          participants: [
                            ...prev.participants,
                            {
                              member_id: newExpense.paid_by,
                              paid_amt: 0,
                            },
                          ],
                        }));
                      }
                    }
                    // Clear amount error when toggling
                    if (validationErrors.amount) {
                      setValidationErrors((prev) => ({ ...prev, amount: "" }));
                    }
                  }}
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
                    min="0"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onWheel={(e) => e.target.blur()}
                    onChange={(e) => {
                      setNewExpense({ ...newExpense, amount: e.target.value });
                      if (validationErrors.amount) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          amount: "",
                        }));
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      validationErrors.amount
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                  />
                  {validationErrors.amount && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.amount}
                    </p>
                  )}
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
                      min="0"
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
                      const payerEntries = newExpense.participants.filter(
                        (p) => p.member_id === member.id
                      );
                      const participant =
                        payerEntries.length > 0 ? payerEntries[0] : null;
                      const isSelected = !!participant;
                      const isPaidBy = member.id === newExpense.paid_by;

                      return (
                        <div
                          key={member.id}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected || isPaidBy}
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
                          {(isSelected || isPaidBy) && (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={formatAmountForDisplay(
                                participant?.paid_amt || 0,
                                member.id
                              )}
                              onChange={(e) =>
                                handleParticipantAmountChange(
                                  member.id,
                                  e.target.value
                                )
                              }
                              onWheel={(e) => e.target.blur()}
                              onKeyDown={(e) => {
                                // Prevent multiple zeros at the beginning
                                if (e.key === "0" && e.target.value === "0") {
                                  e.preventDefault();
                                }
                              }}
                              className="w-32 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Show total of participant amounts */}
                  {newExpense.participants.length > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          Total from participants:
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          $
                          {newExpense.participants
                            .reduce((sum, p, index, array) => {
                              // Only count each member once
                              const firstIndex = array.findIndex(
                                (item) => item.member_id === p.member_id
                              );
                              return firstIndex === index
                                ? sum + (parseFloat(p.paid_amt) || 0)
                                : sum;
                            }, 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  style={{ cursor: "pointer" }}
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
                    setValidationErrors({
                      title: "",
                      paid_by: "",
                      amount: "",
                      participants: "",
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
