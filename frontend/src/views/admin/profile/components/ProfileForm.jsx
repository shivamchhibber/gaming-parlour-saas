import React, { useState, useEffect } from "react";
import Card from "components/card";
import { api, authService } from "../../../../services/authService";
import { MdEdit, MdSave, MdCancel } from "react-icons/md";

const ProfileForm = () => {
    const [user, setUser] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        full_name: "",
        phone: "",
        organization_name: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const currentUser = authService.getCurrentUser();

            if (currentUser) {
                setUser(currentUser);
                setFormData({
                    username: currentUser.username || "",
                    email: currentUser.email || "",
                    full_name: currentUser.full_name || "",
                    phone: currentUser.phone || "",
                    organization_name: currentUser.organization_name || "Game Parlour Admin",
                });
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setError("Failed to load profile");
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            // For now, we'll just update the local storage since the backend
            // might not have a user profile update endpoint
            const updatedUser = {
                ...user,
                ...formData
            };

            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setEditMode(false);
            setSuccess("Profile updated successfully!");

            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            setError("Failed to update profile");
        }

        setSaving(false);
    };

    const handleCancel = () => {
        // Reset form data to original user data
        setFormData({
            username: user?.username || "",
            email: user?.email || "",
            full_name: user?.full_name || "",
            phone: user?.phone || "",
            organization_name: user?.organization_name || "Game Parlour Admin",
        });
        setEditMode(false);
        setError("");
    };

    if (loading) {
        return (
            <Card extra="w-full h-full p-6">
                <div className="flex items-center justify-center h-40">
                    <div className="text-gray-500">Loading profile...</div>
                </div>
            </Card>
        );
    }

    return (
        <Card extra="w-full h-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h4 className="text-xl font-bold text-navy-700 dark:text-white">
                        Profile Information
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage your account settings and preferences
                    </p>
                </div>

                {!editMode ? (
                    <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600 transition-colors"
                    >
                        <MdEdit className="h-4 w-4" />
                        Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 transition-colors disabled:bg-gray-400"
                        >
                            <MdSave className="h-4 w-4" />
                            {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-2 rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600 transition-colors"
                        >
                            <MdCancel className="h-4 w-4" />
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-4 rounded-lg bg-red-100 border border-red-400 text-red-700 px-4 py-3">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-lg bg-green-100 border border-green-400 text-green-700 px-4 py-3">
                    {success}
                </div>
            )}

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Username
                    </label>
                    {editMode ? (
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:bg-navy-700 dark:border-gray-600 dark:text-white"
                        />
                    ) : (
                        <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-navy-700">
                            {user?.username || "Not set"}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                    </label>
                    {editMode ? (
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:bg-navy-700 dark:border-gray-600 dark:text-white"
                        />
                    ) : (
                        <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-navy-700">
                            {user?.email || "Not set"}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                    </label>
                    {editMode ? (
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:bg-navy-700 dark:border-gray-600 dark:text-white"
                        />
                    ) : (
                        <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-navy-700">
                            {user?.full_name || "Not set"}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Role
                    </label>
                    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-navy-700">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-brand-100 text-brand-800">
                            {user?.role || "Administrator"}
                        </span>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Organization
                    </label>
                    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-navy-700">
                        {user?.organization_name || formData.organization_name}
                    </div>
                </div>
            </div>

            {/* Account Statistics */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                <h5 className="text-lg font-semibold text-navy-700 dark:text-white mb-4">
                    Account Statistics
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-navy-700">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {user?.id || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">User ID</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-navy-700">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            Active
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-4 text-center dark:bg-navy-700">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {new Date().toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Last Login</p>
                    </div>
                    <div className="rounded-lg bg-orange-50 p-4 text-center dark:bg-navy-700">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            Admin
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Access Level</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ProfileForm;
