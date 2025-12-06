import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import { groupService } from "../services/groupService";
import { useError } from "../hooks/useError";
import { authService } from "../services/authService";
import Button from "../components/Button";

const GroupTransactionHistoryPage = () => {
  const location = useLocation();
  const { groupId, groupName } = location.state || {};
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error: error, setError, clearError } = useError();
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);

  const fetchTransactions = async () => {
    if (!groupId) return;

    try {
      setError(null);
      setRefreshing(true);
      const response = await groupService.groupTransactionHistory(groupId);
      setTransactions(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch transaction history"
      );
      // console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const fetchMembers = async () => {
    try {
      setRefreshing(true);
      const res = await groupService.getMembers(groupId);
      setMembers(res.data);
    } catch (err) {
      setError("Error fetching Member Lists.");
    } finally {
      // setLoading(false);
      setRefreshing(false);
    }
  };
  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const res = await authService.listUsers();
      setUsers(res.data);
    } catch (err) {
      setError("Error fetching User Lists.");
    } finally {
      // setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    fetchTransactions();
    fetchMembers();
    fetchUsers();
  }, [groupId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case "A":
        return "Actual";
      default:
        return "Transaction";
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleRefresh = () => {
    fetchTransactions();
    fetchMembers();
    fetchUsers();
  };

  //function to get memberobject from ids
  const getMemberObject = function (mId) {
    return members.find((m) => m.id == mId);
  };

  //function to get Userobject from ids
  const getUserObject = function (uId) {
    return users.find((u) => u.id == uId);
  };
  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ErrorMessage
          error={error}
          onDismiss={() => setError(null)}
          autoDismiss={true}
          dismissTime={5000}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                style={{ cursor: "pointer" }}
                onClick={handleBack}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Go back"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                Transaction History
              </h1>
            </div>

            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <svg
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </Button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="h-12 w-12 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No transactions found
              </h3>
              <p className="text-gray-500">
                This group doesn't have any transaction history yet.
              </p>
            </div>
          ) : (
            <p className="text-gray-600">
              Showing {transactions.length} transaction
              {transactions.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Transactions List */}
        {transactions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recorded By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(transaction.created_at)}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.payment)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getMemberObject(transaction.debtor)?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getMemberObject(transaction.creditor)?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getUserObject(transaction.recorded_by)?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getTransactionTypeLabel(transaction.type)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {transactions.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No transactions yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Transactions will appear here when members settle debts or make
              adjustments in this group.
            </p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupTransactionHistoryPage;
