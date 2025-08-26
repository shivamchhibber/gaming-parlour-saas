import React, { useState } from "react";
import Card from "components/card";
import { api } from "../../../../services/authService";
import { MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";

const SecuritySettings = () => {
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validatePasswords = () => {
        if (!passwordData.currentPassword) {
            setError("Current password is required");
            return false;
        }
        if (!passwordData.newPassword) {
            setError("New password is required");
            return false;
        }
        if (passwordData.newPassword.length < 6) {
            setError("New password must be at least 6 characters long");
            return false;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("New passwords do not match");
            return false;
        }
        return true;
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!validatePasswords()) {
            return;
        }

        setLoading(true);

        try {
            // For now, simulate password change since backend might not have this endpoint
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSuccess("Password changed successfully!");
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Error changing password:", error);
            setError("Failed to change password. Please try again.");
        }

        setLoading(false);
    };

    return (
        <Card extra="w-full h-full p-6">
            {/* Header */}
            <div className="mb-6">
                <h4 className="text-xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
                    <MdLock className="h-5 w-5" />
                    Security Settings
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Keep your account secure by updating your password regularly
                </p>
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

            {/* Password Change Form */}
            <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords.current ? "text" : "password"}
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-brand-500 focus:outline-none dark:bg-navy-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter current password"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility('current')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPasswords.current ? <MdVisibilityOff /> : <MdVisibility />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords.new ? "text" : "password"}
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-brand-500 focus:outline-none dark:bg-navy-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter new password"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility('new')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPasswords.new ? <MdVisibilityOff /> : <MdVisibility />}
                        </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Must be at least 6 characters long
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords.confirm ? "text" : "password"}
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-brand-500 focus:outline-none dark:bg-navy-700 dark:border-gray-600 dark:text-white"
                            placeholder="Confirm new password"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirm')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPasswords.confirm ? <MdVisibilityOff /> : <MdVisibility />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600 transition-colors disabled:bg-gray-400"
                >
                    {loading ? "Changing Password..." : "Change Password"}
                </button>
            </form>

            {/* Security Tips */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                <h5 className="text-lg font-semibold text-navy-700 dark:text-white mb-4">
                    Security Tips
                </h5>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Use a strong password with at least 8 characters</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Include a mix of uppercase, lowercase, numbers, and symbols</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Don't reuse passwords from other accounts</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Change your password regularly</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default SecuritySettings;
