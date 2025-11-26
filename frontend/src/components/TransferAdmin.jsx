import { useState, useEffect } from "react";
import Button from "./Button";
import { groupService } from "../services/groupService";

const TransferAdmin = ({
  groupForm,
  setGroupForm,
  currentUser,
  groupMembers = [],
  group,
}) => {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState({});

  // Filter verified members excluding current admin
  const eligibleMembers = groupMembers.filter(
    (member) => member.verified && member.user_id !== groupForm.admin
  );

  const handleTransferAdmin = async () => {
    await groupService.partialUpdateGroup(group.id, selectedNewAdmin);

    setGroupForm({
      ...groupForm,
      admin: selectedNewAdmin,
    });
    setShowTransferModal(false);
    setSelectedNewAdmin({});
  };

  return (
    <>
      <div className="mt-6 p-4 border border-red-200 rounded-lg bg-red-50">
        <h3 className="text-lg font-medium text-red-800 mb-2">
          Transfer Admin Rights
        </h3>
        <p className="text-sm text-red-600 mb-3">
          Transfer admin rights to another verified member. This action cannot
          be undone.
        </p>
        <button
          style={{ cursor: "pointer" }}
          type="button"
          onClick={() => setShowTransferModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Transfer Admin
        </button>
      </div>

      {/* Transfer Admin Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-end z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Transfer Admin Rights
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Admin
              </label>
              <select
                value={selectedNewAdmin.admin}
                onChange={(e) => setSelectedNewAdmin({ admin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Choose a member...</option>
                {eligibleMembers.map((member) => (
                  <option key={member.id} value={member.user_id}>
                    {member.name} {member.email ? `(${member.email})` : ""}
                  </option>
                ))}
              </select>

              {eligibleMembers.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No eligible members found. Only verified members can become
                  admins.
                </p>
              )}
            </div>

            <div className="flex space-x-3 justify-end">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedNewAdmin({});
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleTransferAdmin}
                disabled={!selectedNewAdmin}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                style={{
                  cursor: !selectedNewAdmin ? "not-allowed" : "pointer",
                }}
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransferAdmin;
