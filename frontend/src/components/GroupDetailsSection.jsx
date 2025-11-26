import React, { useEffect, useState } from "react";
import { groupService } from "../services/groupService";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
const GroupDetailsSection = ({
  group,
  members,
  onAddMember,
  onMemberClick,
  onRefresh,
}) => {
  const navigate = useNavigate;

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ email: "", name: "" });
  const [user, setUser] = useState(null);
  const [isAdmin, setAdmin] = useState(false);
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.profile();
        setUser(res.data);
      } catch (err) {
        console.error("Unauthorized or expired token", err);
        navigate("/login");
      }
    };
    fetchProfile();
  }, [navigate]);

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
      {/* Section Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Group Details</h2>
      </div>

      {/* Group Info */}
      <div className="space-y-3 mb-6">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Admin:</span> {adminName}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Members:</span> {members.length}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Created:</span>{" "}
          {new Date(group?.created_at).toLocaleDateString()}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Description:</span> {group?.description}
        </p>
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
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
