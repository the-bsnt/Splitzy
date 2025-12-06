import api from "../api/axios";

export const groupService = {
  // Group CRUD
  getGroups: () => api.get("/groups/"),
  createGroup: (groupData) => api.post("/groups/", groupData),
  getGroup: (groupId) => api.get(`/groups/${groupId}/`),
  updateGroup: (groupId, groupData) =>
    api.put(`/groups/${groupId}/`, groupData),
  partialUpdateGroup: (groupId, groupData) =>
    api.patch(`/groups/${groupId}/`, groupData),
  deleteGroup: (groupId) => api.delete(`/groups/${groupId}/`),

  // Members
  getMembers: (groupId) => api.get(`/groups/${groupId}/members/`),
  addMember: (groupId, memberData) =>
    api.post(`/groups/${groupId}/members/`, memberData),
  getMember: (groupId, memberId) =>
    api.get(`/groups/${groupId}/members/${memberId}/`),
  updateMember: (groupId, memberId, memberData) =>
    api.put(`/groups/${groupId}/members/${memberId}/`, memberData),
  partialUpdateMember: (groupId, memberId, memberData) =>
    api.patch(`/groups/${groupId}/members/${memberId}/`, memberData),
  deleteMember: (groupId, memberId) =>
    api.delete(`/groups/${groupId}/members/${memberId}/`),

  // Invitations
  inviteMember: (groupId, memberId) =>
    api.post(`/groups/${groupId}/members/${memberId}/invite/`),
  acceptInvitation: (token) => api.post(`/groups/join/?token=${token}`),
  rejectInvitation: (token) => api.post(`/groups/join/?token=${token}`),
  listInvitationsForUser: () => api.get("groups/invitations/"),

  //Transcation-History
  groupTransactionHistory: (groupId) =>
    api.get(`/groups/${groupId}/transaction/history/`),
};
