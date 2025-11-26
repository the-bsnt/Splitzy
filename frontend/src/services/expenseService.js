import api from "../api/axios";

export const expenseService = {
  // Expenses
  createExpense: (groupId, expenseData) =>
    api.post(`/groups/${groupId}/expenses/`, expenseData),
  listExpense: (groupId) => api.get(`/groups/${groupId}/expenses/`),
  getExpense: (groupId, expenseId) =>
    api.get(`/groups/${groupId}/expenses/${expenseId}/`),
  // Balances & Settlements
  getBalances: (groupId) => api.get(`/groups/${groupId}/balances/`),
  recordPayment: (groupId, paymentData) =>
    api.post(`/groups/${groupId}/settlement/`, paymentData),
  suggestedSettlements: (groupId) =>
    api.get(`/groups/${groupId}/suggested-settlements/`),
};
