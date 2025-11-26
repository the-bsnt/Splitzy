import React, { useState } from "react";
import { groupService } from "../services/groupService";

const GroupSettingsSection = ({ group, members, onUpdateGroup, onRefresh }) => {
  const [editingGroup, setEditingGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: group?.name || "",
    description: group?.description || "",
  });

  const isAdmin = true; // Replace with actual admin check

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

      {/* Manage Members */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Manage Members
        </h3>
        <div className="space-y-3">
          {members.map((member) => (
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
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsSection;
