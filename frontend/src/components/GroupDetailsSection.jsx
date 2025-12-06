import React, { useEffect, useState } from "react";
import { groupService } from "../services/groupService";
import { authService } from "../services/authService";
import { NavLink, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import {
  Users,
  Calendar,
  FileText,
  User,
  History,
  ChevronRight,
} from "lucide-react";
const GroupDetailsSection = ({
  group,
  members,
  onAddMember,
  onMemberClick,
  onRefresh,
  user,
}) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ email: "", name: "" });

  const [isAdmin, setAdmin] = useState(false);

  useEffect(() => {
    if (user && group) {
      if (user.id === group.admin) {
        setAdmin(true);
      } else {
        setAdmin(false);
      }
    }
  }, [user, group]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await onAddMember(newMember);
      setNewMember({ email: "", name: "" });
      setShowAddMember(false);
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  const handleInviteMember = async (memberId) => {
    try {
      await groupService.inviteMember(group.id, memberId);
      onRefresh();
    } catch (error) {
      console.error("Error inviting member:", error);
    }
  };
  function getGroupNameAdmin(group, members) {
    const adminMember = members.find(
      (member) => member.user_id === group.admin
    );

    return adminMember ? adminMember.name : null;
  }
  const adminName = getGroupNameAdmin(group, members);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Group Details
        </h2>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Info Grid */}
        <div className="grid gap-3">
          {/* Admin */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="mt-0.5 p-2 bg-blue-100 rounded-lg">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Admin
              </p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {adminName}
              </p>
            </div>
          </div>

          {/* Members Count */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="mt-0.5 p-2 bg-green-100 rounded-lg">
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Members
              </p>
              <p className="text-sm font-medium text-gray-900">
                {members.length} {members.length === 1 ? "member" : "members"}
              </p>
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="mt-0.5 p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Created
              </p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(group?.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Description */}
          {group?.description && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="mt-0.5 p-2 bg-orange-100 rounded-lg">
                <FileText className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Description
                </p>
                <p className="text-sm text-gray-900 leading-relaxed">
                  {group.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Transaction History Button */}
        <div className="pt-2">
          <NavLink
            to="transaction-history"
            state={{
              groupId: group?.id,
              groupName: group?.name,
            }}
            className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md group"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="font-medium">Transaction History</span>
            </div>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </NavLink>
        </div>
      </div>
      {/* Members Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Members</h3>
          {
            <Button
              onClick={() => setShowAddMember(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Member
            </Button>
          }
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {members.map((member) => (
            <div
              key={member.id}
              onClick={() => onMemberClick(member)}
              className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div>
                <div className="font-medium text-gray-900">
                  {member.name || "No Name"}
                </div>
                <div className="text-sm text-gray-500">{member.email}</div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    member.verified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {member.verified ? "Verified" : "Unverified"}
                </span>
                {!member.verified && isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInviteMember(member.id);
                    }}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                    style={{ cursor: "pointer" }}
                  >
                    Invite
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Dialog Box */}
      {showAddMember && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember({ ...newMember, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Name"
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  style={{ cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  style={{ cursor: "pointer" }}
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetailsSection;
