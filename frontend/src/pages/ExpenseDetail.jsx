import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { expenseService } from "../services/expenseService";
import { groupService } from "../services/groupService";
import Button from "../components/Button";
import ErrorMessage from "../components/ErrorMessage";
import { useError } from "../hooks/useError";
import { useNotification } from "../hooks/notification";
import NotificationContainer from "../components/Notification";

const ExpenseDetail = () => {
  const location = useLocation();
  const { groupId, expenseId, groupName } = location.state || {};
  const [members, setMembers] = useState([]);
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error: fetchError, setError, clearError } = useError();
  const [proposedTransactions, setProposedTransactions] = useState([]);

  // New state for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editExpenseData, setEditExpenseData] = useState({
    title: "",
    description: "",
    paid_by: "",
    amount: "",
    participants: [],
  });
  const [includeParticipants, setIncludeParticipants] = useState(false);

  // Removed editSuccess state since we're handling refresh differently
  // Form validation errors state
  const [formErrors, setFormErrors] = useState({
    title: "",
    paid_by: "",
    amount: "",
    participants: "",
  });

  const { notifications, addNotification, removeNotification } =
    useNotification();

  // Function to fetch expense details
  const fetchExpenseDetail = async () => {
    try {
      setLoading(true);
      const expenseRes = await expenseService.getExpense(groupId, expenseId);
      setExpense(expenseRes.data);
      // Initialize edit form with current expense data
      if (expenseRes.data) {
        setEditExpenseData({
          title: expenseRes.data.title || "",
          description: expenseRes.data.description || "",
          paid_by: expenseRes.data.paid_by || "",
          amount: expenseRes.data.amount || "",
          participants: expenseRes.data.participants || [],
        });
        // If there are participants with custom amounts, enable custom participants
        if (
          expenseRes.data.participants &&
          expenseRes.data.participants.length > 0
        ) {
          setIncludeParticipants(true);
        }
      }
    } catch (err) {
      setError("Failed to fetch expense details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseDetail();
  }, [groupId, expenseId]);
  const fetchProposedTransactions = async () => {
    try {
      const tRes = await expenseService.proposedTransactions(
        groupId,
        expenseId
      );
      setProposedTransactions(tRes.data);
    } catch (err) {
      setError("Failed to fetch Proposed Transactions.");
    }
  };
  useEffect(() => {
    fetchProposedTransactions();

    const fetchMembers = async () => {
      try {
        const memberRes = await groupService.getMembers(groupId);
        setMembers(memberRes.data);
      } catch (err) {
        setError("Failed to fetch participants.");
      }
    };
    fetchMembers();
  }, [groupId]);

  // When paid_by changes, ensure payer is in participants
  useEffect(() => {
    if (includeParticipants && editExpenseData.paid_by) {
      const payerInParticipants = editExpenseData.participants.find(
        (p) => p.member_id === editExpenseData.paid_by
      );

      if (!payerInParticipants) {
        // Add payer to participants with amount 0
        setEditExpenseData((prev) => ({
          ...prev,
          participants: [
            ...prev.participants,
            {
              member_id: editExpenseData.paid_by,
              paid_amt: 0,
            },
          ],
        }));
      }
    }
  }, [editExpenseData.paid_by, includeParticipants]);

  // When custom participants toggle is enabled/disabled
  useEffect(() => {
    if (includeParticipants && editExpenseData.paid_by) {
      // Ensure payer is checked when custom participants is enabled
      const payerInParticipants = editExpenseData.participants.find(
        (p) => p.member_id === editExpenseData.paid_by
      );

      if (!payerInParticipants) {
        setEditExpenseData((prev) => ({
          ...prev,
          participants: [
            ...prev.participants,
            {
              member_id: editExpenseData.paid_by,
              paid_amt: 0,
            },
          ],
        }));
      }
    }
  }, [includeParticipants]);

  const getMemberObject = function (mId) {
    return members.find((m) => m.id == mId);
  };

  const getBalance = function (amt) {
    return (amt - expense.amount / expense.participants?.length).toFixed();
  };

  // Handle opening edit modal
  const handleEditClick = () => {
    setShowEditModal(true);
    clearError();
    // Clear form errors when opening modal
    setFormErrors({
      title: "",
      paid_by: "",
      amount: "",
      participants: "",
    });
  };

  // Handle closing edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    // Reset form to original data
    if (expense) {
      setEditExpenseData({
        title: expense.title || "",
        description: expense.description || "",
        paid_by: expense.paid_by || "",
        amount: expense.amount || "",
        participants: expense.participants || [],
      });
      setIncludeParticipants(
        expense.participants && expense.participants.length > 0
      );
    }
    // Clear form errors
    setFormErrors({
      title: "",
      paid_by: "",
      amount: "",
      participants: "",
    });
  };

  // Handle participant toggle for edit form
  const handleParticipantToggle = (memberId) => {
    const isPaidBy = memberId === editExpenseData.paid_by;
    if (isPaidBy) return; // Don't allow toggling the payer

    const existingIndex = editExpenseData.participants.findIndex(
      (p) => p.member_id === memberId
    );

    const updatedParticipants = [...editExpenseData.participants];

    if (existingIndex >= 0) {
      // Remove participant
      updatedParticipants.splice(existingIndex, 1);
    } else {
      // Add participant with zero amount
      updatedParticipants.push({
        member_id: memberId,
        paid_amt: 0,
      });
    }

    setEditExpenseData({
      ...editExpenseData,
      participants: updatedParticipants,
    });

    // Clear participants error when user interacts
    if (formErrors.participants) {
      setFormErrors((prev) => ({ ...prev, participants: "" }));
    }
  };

  // Handle participant amount change
  const handleParticipantAmountChange = (memberId, value) => {
    // Handle empty string or invalid input
    if (value === "" || value === null || value === undefined) {
      value = "0";
    }

    // Convert to number, handle decimals properly
    const numValue = parseFloat(value);
    const amount = isNaN(numValue) ? 0 : numValue;

    const updatedParticipants = editExpenseData.participants.map((p) => {
      if (p.member_id === memberId) {
        return { ...p, paid_amt: amount };
      }
      return p;
    });

    setEditExpenseData({
      ...editExpenseData,
      participants: updatedParticipants,
    });
  };

  // Format amount input for display (remove trailing zeros, show empty string for 0)
  const formatAmountForDisplay = (amount, memberId) => {
    if (amount === 0 || amount === "0" || amount === 0.0) {
      return "";
    }
    return amount.toString();
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {
      title: "",
      paid_by: "",
      amount: "",
      participants: "",
    };
    let isValid = true;

    // Validate title
    if (!editExpenseData.title.trim()) {
      errors.title = "Title is required";
      isValid = false;
    }

    // Validate paid_by
    if (!editExpenseData.paid_by) {
      errors.paid_by = "Please select who paid for this expense";
      isValid = false;
    }

    // Validate amount based on whether custom participants are enabled
    if (!includeParticipants) {
      // When not using custom participants, amount is required and must be > 0
      const amount = parseFloat(editExpenseData.amount);
      if (!editExpenseData.amount || isNaN(amount) || amount <= 0) {
        errors.amount = "Amount must be greater than 0";
        isValid = false;
      }
    } else {
      // When using custom participants, check if amount is provided
      if (editExpenseData.amount) {
        const amount = parseFloat(editExpenseData.amount);
        if (isNaN(amount) || amount < 0) {
          errors.amount = "Amount must be a valid number (≥ 0)";
          isValid = false;
        }
      }
    }

    // Validate custom participants
    if (includeParticipants) {
      if (editExpenseData.participants.length === 0) {
        errors.participants = "Please select at least one participant";
        isValid = false;
      } else {
        // Validate that all participants have valid amounts
        const invalidParticipants = editExpenseData.participants.filter(
          (p) => isNaN(parseFloat(p.paid_amt)) || parseFloat(p.paid_amt) < 0
        );

        if (invalidParticipants.length > 0) {
          errors.participants =
            "All participant amounts must be valid numbers (≥ 0)";
          isValid = false;
        }

        // Calculate total from participants
        const totalFromParticipants = editExpenseData.participants.reduce(
          (sum, p) => sum + (parseFloat(p.paid_amt) || 0),
          0
        );

        // If total amount is provided, validate it against participants total
        if (editExpenseData.amount) {
          const providedAmount = parseFloat(editExpenseData.amount);
          if (!isNaN(providedAmount) && providedAmount > 0) {
            // If amount is provided, participants total should match it
            if (Math.abs(totalFromParticipants - providedAmount) > 0.01) {
              errors.participants = `Total from participants ($${totalFromParticipants.toFixed(
                2
              )}) doesn't match the total amount ($${providedAmount.toFixed(
                2
              )})`;
              isValid = true;
            }
          }
        } else {
          // If no total amount is provided, participants total should be > 0
          if (totalFromParticipants <= 0) {
            errors.participants =
              "Total from participants must be greater than 0";
            isValid = false;
          }
        }
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Prepare data for API
    const requestData = {
      title: editExpenseData.title,
      description: editExpenseData.description,
      paid_by: editExpenseData.paid_by,
    };

    // Include amount if not using custom participants
    if (!includeParticipants) {
      requestData.amount = parseFloat(editExpenseData.amount);
    } else {
      // Include participants array
      const participantsToSend = editExpenseData.participants.map((p) => ({
        member_id: p.member_id,
        paid_amt: parseFloat(p.paid_amt) || 0,
      }));

      requestData.participants = participantsToSend;

      // Include amount if provided (optional for custom participants)
      if (editExpenseData.amount && parseFloat(editExpenseData.amount) > 0) {
        requestData.amount = parseFloat(editExpenseData.amount);
      }
    }

    try {
      setEditLoading(true);
      clearError(); // Clear any previous fetch errors

      await expenseService.editExpense(groupId, expenseId, requestData);

      // Refresh the expense data
      await fetchExpenseDetail();
      fetchProposedTransactions();

      // Close modal first
      setShowEditModal(false);

      // Show success notification
      addNotification("Expense updated successfully!", "success");

      // Clear form errors on success
      setFormErrors({
        title: "",
        paid_by: "",
        amount: "",
        participants: "",
      });
    } catch (err) {
      // Show error notification
      addNotification(
        err.response?.data?.message || "Failed to update expense",
        "error"
      );
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Loading expense details...</div>
      </div>
    );
  }

  if (fetchError)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ErrorMessage
          error={fetchError}
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
    <>
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        {/* ... (rest of the existing JSX remains the same) ... */}
        {/* Header */}
        <div className="border-b pb-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              {expense.title}
            </h1>

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
                          ${parseFloat(transaction.payment).toFixed(2)}
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
                  $
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
            onClick={handleEditClick}
            disabled={expense.is_settled}
          >
            {expense.is_settled
              ? "Cannot Edit Settled Expense"
              : "Edit Expense"}
          </Button>
        </div>
      </div>

      {/* Edit Expense Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Edit Expense
                </h3>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      placeholder="Expense title"
                      value={editExpenseData.title}
                      onChange={(e) => {
                        setEditExpenseData({
                          ...editExpenseData,
                          title: e.target.value,
                        });
                        if (formErrors.title) {
                          setFormErrors((prev) => ({ ...prev, title: "" }));
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.title ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                    />
                    {formErrors.title && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      placeholder="Expense description"
                      value={editExpenseData.description}
                      onChange={(e) =>
                        setEditExpenseData({
                          ...editExpenseData,
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
                      value={editExpenseData.paid_by}
                      onChange={(e) => {
                        setEditExpenseData({
                          ...editExpenseData,
                          paid_by: e.target.value,
                        });
                        if (formErrors.paid_by) {
                          setFormErrors((prev) => ({ ...prev, paid_by: "" }));
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.paid_by
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      required
                    >
                      <option value="">Select who paid</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name || member.email}
                        </option>
                      ))}
                    </select>
                    {formErrors.paid_by && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.paid_by}
                      </p>
                    )}
                  </div>

                  {/* Toggle for custom participants */}
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="editIncludeParticipants"
                      checked={includeParticipants}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setIncludeParticipants(isChecked);
                        if (!isChecked) {
                          // Clear participants when disabling custom participants
                          setEditExpenseData({
                            ...editExpenseData,
                            participants: [],
                          });
                          // Clear participants error
                          setFormErrors((prev) => ({
                            ...prev,
                            participants: "",
                            amount: "",
                          }));
                        } else if (editExpenseData.paid_by) {
                          // Add payer when enabling custom participants
                          const payerInParticipants =
                            editExpenseData.participants.find(
                              (p) => p.member_id === editExpenseData.paid_by
                            );

                          if (!payerInParticipants) {
                            setEditExpenseData((prev) => ({
                              ...prev,
                              participants: [
                                ...prev.participants,
                                {
                                  member_id: editExpenseData.paid_by,
                                  paid_amt: 0,
                                },
                              ],
                            }));
                          }
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="editIncludeParticipants"
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
                        value={editExpenseData.amount}
                        onWheel={(e) => e.target.blur()}
                        onChange={(e) => {
                          setEditExpenseData({
                            ...editExpenseData,
                            amount: e.target.value,
                          });
                          // Clear amount error when user starts typing
                          if (formErrors.amount) {
                            setFormErrors((prev) => ({ ...prev, amount: "" }));
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.amount
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        required
                      />
                      {formErrors.amount && (
                        <p className="mt-1 text-sm text-red-600">
                          {formErrors.amount}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Custom participants section */}
                  {includeParticipants && (
                    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <h4 className="font-medium text-gray-900">
                        Participants
                      </h4>
                      <p className="text-sm text-gray-600">
                        Select participants and specify their share amounts.
                        Total amount is optional.
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
                          value={editExpenseData.amount}
                          onWheel={(e) => e.target.blur()}
                          onChange={(e) => {
                            setEditExpenseData({
                              ...editExpenseData,
                              amount: e.target.value,
                            });
                            // Clear amount error when user starts typing
                            if (formErrors.amount) {
                              setFormErrors((prev) => ({
                                ...prev,
                                amount: "",
                              }));
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.amount
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {formErrors.amount && (
                          <p className="mt-1 text-sm text-red-600">
                            {formErrors.amount}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {members.map((member) => {
                          const participant = editExpenseData.participants.find(
                            (p) => p.member_id === member.id
                          );
                          const isSelected = !!participant;
                          const isPaidBy =
                            member.id === editExpenseData.paid_by;

                          return (
                            <div
                              key={member.id}
                              className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected || isPaidBy}
                                onChange={() =>
                                  handleParticipantToggle(member.id)
                                }
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
                                    if (
                                      e.key === "0" &&
                                      e.target.value === "0"
                                    ) {
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

                      {/* Show participants error */}
                      {formErrors.participants && (
                        <div className="pt-2">
                          <p className="text-sm text-red-600">
                            {formErrors.participants}
                          </p>
                        </div>
                      )}

                      {/* Show total of participant amounts */}
                      {editExpenseData.participants.length > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              Total from participants:
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              $
                              {editExpenseData.participants
                                .reduce(
                                  (sum, p) =>
                                    sum + (parseFloat(p.paid_amt) || 0),
                                  0
                                )
                                .toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleCloseEditModal}
                      disabled={editLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="red" disabled={editLoading}>
                      {editLoading ? "Updating..." : "Update Expense"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notification Container outside modal */}
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </>
  );
};

export default ExpenseDetail;
