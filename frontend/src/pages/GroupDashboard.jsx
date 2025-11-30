import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { groupService } from "../services/groupService";
import { expenseService } from "../services/expenseService";
import { authService } from "../services/authService";
import GroupDetailsSection from "../components/GroupDetailsSection";
import ExpenseSection from "../components/ExpenseSection";
import BalancesSection from "../components/BalancesSection";
import GroupSettingsSection from "../components/GroupSettingsSection";
import MemberDetailModal from "../components/MemberDetailModal";
import Button from "../components/Button";
import { DollarSign, Mail, Pointer, Settings, User } from "lucide-react";
import ErrorMessage from "../components/ErrorMessage";
import { useError } from "../hooks/useError";

const GroupDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const groupId = location.state?.groupId;
  const [isAdmin, setAdmin] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [suggestedTransactions, setSuggestedTransactions] = useState([]);
  const [activeSection, setActiveSection] = useState("balances");
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null);
  const { error: error, setError, clearError } = useError();
  const [currentUser, setCurrentUser] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    debtor: "",
    creditor: "",
    payment: "",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.profile();
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Unauthorized or expired token", err);
        navigate("/login");
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    if (groupId) {
      loadGroupData();
      loadExpenseData();
    } else {
      navigate("/dashboard");
    }
  }, [groupId, navigate]);

  useEffect(() => {
    if (currentUser && currentGroup) {
      if (currentUser.id === currentGroup.admin) {
        setAdmin(true);
      } else {
        setAdmin(false);
      }
    }
  }, [currentUser, currentGroup]);
  const loadGroupData = async () => {
    try {
      setLoading(true);
      const [
        groupResponse,
        membersResponse,
        balancesResponse,
        transactionsResponse,
      ] = await Promise.all([
        groupService.getGroup(groupId),
        groupService.getMembers(groupId),
        expenseService.getBalances(groupId),
        expenseService.suggestedSettlements(groupId),
      ]);
      setCurrentGroup(groupResponse.data);
      setMembers(membersResponse.data);
      setBalances(convertToFloat(balancesResponse.data));
      setSuggestedTransactions(transactionsResponse.data);
    } catch (err) {
      setError("Failed to load data");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };
  const convertToFloat = (balanceList) =>
    balanceList.map((item) => ({
      ...item,
      balance: parseFloat(item.balance),
    }));
  const loadExpenseData = async () => {
    try {
      setLoading(true);
      const [expenseResponse] = await Promise.all([
        expenseService.listExpense(groupId),
      ]);

      const sorted_data = expenseResponse.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setExpenses(sorted_data);
    } catch (err) {
      setError("Failed to load expense data");
    } finally {
      setLoading(false);
    }
  };

  // Add the  handleAddMember function
  const handleAddMember = async (memberData) => {
    try {
      const response = await groupService.addMember(groupId, memberData);
      setMembers((prev) => [...prev, response.data]);
    } catch (err) {
      setError("Failed to add member");
      console.error("Error adding member:", err);
    }
  };

  // Add the  handleAddExpense function
  const handleAddExpense = async (expenseData) => {
    try {
      const response = await expenseService.createExpense(groupId, expenseData);
      setExpenses((prev) => [...prev, response.data]);
      await loadGroupData();
      await loadExpenseData();
    } catch (err) {
      setError("Failed to add expense");
      console.error("Error adding expense:", err);
    }
  };

  const openPaymentModal = () => {
    setShowPaymentModal(true);
  };
  // Add the  handleRecordPayment function
  const handleRecordPayment = async (paymentData) => {
    try {
      await expenseService.recordPayment(groupId, paymentData);
      await loadGroupData();
      setShowPaymentModal(false);
      setPaymentData({
        debtor: "",
        creditor: "",
        payment: "",
      });
    } catch (err) {
      setError("Failed to record payment");
      console.error("Error recording payment:", err);
    }
  };
  //function to get memberobject
  const getMemberObject = function (mId) {
    return members.find((m) => m.id == mId);
  };
  // function to logout id ;
  const onLogout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem("access");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  if (!groupId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-lg">No group selected</div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );

  if (error)
    return (
      // <div className="flex items-center justify-center min-h-screen">
      //   <div className="text-red-500 text-lg">{error}</div>
      // </div>

      <div className="flex items-center justify-center min-h-screen">
        <ErrorMessage
          error={error}
          onDismiss={clearError}
          autoDismiss={true}
          dismissTime={5000}
        />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex-1">
            {currentGroup?.name}
          </h1>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {/* User Info */}
            <div className="flex-1 min-w-0" style={{ cursor: "pointer" }}>
              <div className="flex items-center gap-1">
                <div className="bg-indigo-200 p-1 ">
                  <User className="h-5 w-5 text-indigo-600 " />
                </div>
                <h1 className="font-bold text-2xl truncate">
                  {currentUser?.name}
                </h1>
              </div>
              <div className="flex justify-end gap-1 mt-2 ml-2">
                <Mail className="h-3 w-3 mt-0.75" />
                <p className="text-xs text-gray-500 truncate">
                  {currentUser?.email}
                </p>
              </div>
            </div>
            {/* Dropdown */}
            <div className="relative">
              <button
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ cursor: "pointer" }}
              >
                {isDropdownOpen ? (
                  // Red X icon when dropdown is open
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  // Three lines icon when dropdown is closed
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute left mt-2 w-20 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 rounded-t-lg"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate("/dashboard");
                    }}
                  >
                    Dashboard
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 rounded-b-lg text-red-600"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Section - Group Details */}
          <div className="lg:col-span-1 ">
            <GroupDetailsSection
              group={currentGroup}
              members={members}
              onAddMember={handleAddMember}
              onMemberClick={setSelectedMember}
              onRefresh={loadGroupData}
              user={currentUser}
            />
          </div>

          {/* Middle Section - Expenses */}
          <div className="lg:col-span-1">
            <ExpenseSection
              currentUser={currentUser}
              expenses={expenses}
              members={members}
              onAddExpense={handleAddExpense}
              onRecordPayment={() => openPaymentModal()}
              groupName={currentGroup?.name}
            />
          </div>

          {/* Right Section - Balances/Settings */}
          <div className="lg:col-span-1">
            <div className="flex  justify-start gap-3">
              <Button
                varient="ghost"
                className={`px-4 py-2 rounded-sm  h-10 w-auto ${
                  activeSection === "balances"
                    ? "bg-blue-600 text-white"
                    : "opacity-50"
                }`}
                onClick={() => setActiveSection("balances")}
              >
                <DollarSign className="w-5 h-5" />{" "}
                {/* Icon changed to DollarSign */}
                <span>Balances</span>
              </Button>
              <Button
                className={`px-4 py-2 rounded-sm  h-10 w-auto ${
                  activeSection === "settings"
                    ? "bg-blue-600 text-white"
                    : "opacity-50"
                }`}
                onClick={() => setActiveSection("settings")}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Button>
            </div>
            {activeSection === "balances" ? (
              <BalancesSection
                groupId={groupId}
                members={members}
                balances={balances}
                suggestedTransactions={suggestedTransactions}
                loadGroupData={() => loadGroupData()}
              />
            ) : (
              <GroupSettingsSection
                group={currentGroup}
                members={members}
                onUpdateGroup={setCurrentGroup}
                onRefresh={loadGroupData}
                isAdmin={isAdmin}
                currentGroup={currentGroup}
              />
            )}
          </div>
        </div>

        {/* Member Detail Modal */}
        {selectedMember && (
          <MemberDetailModal
            member={selectedMember}
            balances={balances}
            onClose={() => setSelectedMember(null)}
          />
        )}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRecordPayment(paymentData);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payer
                  </label>
                  <select
                    value={paymentData.debtor}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        debtor: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Payer</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Receiver
                  </label>
                  <select
                    value={paymentData.creditor}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        creditor: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Receiver</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.payment}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        payment: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="green"
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Record Payment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDashboard;
