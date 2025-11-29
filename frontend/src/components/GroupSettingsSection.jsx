import React, { useState } from "react";
import { groupService } from "../services/groupService";
import { LucideTrash2 } from "lucide-react";
import TransferAdmin from "./TransferAdmin";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
const GroupSettingsSection = ({
  group,
  members,
  onUpdateGroup,
  onRefresh,
  isAdmin,
  currentGroup,
}) => {
  const [editingGroup, setEditingGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: group?.name || "",
    description: group?.description || "",
    admin: group?.admin || "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // const navigate = useNavigate();
  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      const response = await groupService.updateGroup(group.id, groupForm);
      onUpdateGroup(response.data);
      setEditingGroup(false);
    } catch (error) {
      console.error("Error updating group:", error);
    }
  };
  const handleDeleteGroup = async () => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      try {
        await groupService.deleteGroup(group.id);
        onRefresh();
      } catch (error) {
        console.error("Error deleting group:", error);
        setShowDeleteModal(false);
      }
    }
  };
  const handleRemoveMember = async (memberId) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      try {
        await groupService.deleteMember(group.id, memberId);
        onRefresh();
      } catch (error) {
        console.error("Error removing member:", error);
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Group Settings
        </h2>
        <p className="text-gray-600">
          Only group administrators can modify settings.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Group Settings
      </h2>

      {/* Group Details Form */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Group Information
          </h3>
          <button
            onClick={() => setEditingGroup(!editingGroup)}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            {editingGroup ? "Cancel" : "Edit"}
          </button>
        </div>

        {editingGroup ? (
          <div>
            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, description: e.target.value })
                  }
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-2">
            <p>
              <strong>Name:</strong> {group?.name}
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {group?.description || "No description"}
            </p>
          </div>
        )}
      </div>
      {/* Transfer Admin */}
      <TransferAdmin
        groupForm={groupForm}
        setGroupForm={setGroupForm}
        groupMembers={members}
        currentUser={group?.admin} // current admin user ID
        group={group} // current group
        onRefresh={onRefresh}
      />
      {/* Delete Group */}
      <div className="mt-6 p-4 border border-red-200 rounded-lg bg-red-50">
        <h3 className="text-lg font-medium text-red-800 mb-2">Delete Group</h3>
        <p className="text-sm text-red-600 mb-3">
          Once you delete a group, there is no going back. Please be certain.
        </p>
        <button
          style={{ cursor: "pointer" }}
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Delete Group
        </button>
      </div>
      {/* Delete Model */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Confirm Deletion
            </h3>

            <p className="text-gray-600 mb-4">
              This action cannot be undone. Type{" "}
              <span className="font-bold">DELETE</span> to confirm.
            </p>

            <input
              type="text"
              placeholder="Type DELETE here"
              className="w-full p-2 border border-gray-300 rounded mb-4"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />

            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </Button>
              <button
                onClick={handleDeleteGroup}
                disabled={confirmText !== "DELETE"}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400 "
                style={{
                  cursor: confirmText !== "DELETE" ? "not-allowed" : "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Manage Members */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Manage Members
        </h3>
        <div className="space-y-3">
          {members
            .filter((member) => currentGroup.admin !== member.user_id)
            .map((member) => (
              <div
                key={member.id}
                className="flex justify-between items-center p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {member.name || "No Name"}
                  </div>
                  <div className="text-sm text-gray-500">{member.email}</div>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                  style={{ cursor: "pointer" }}
                >
                  <LucideTrash2 />
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsSection;
