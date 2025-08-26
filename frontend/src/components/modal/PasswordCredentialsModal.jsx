import React, { useState } from "react";
import { MdClose, MdContentCopy, MdVisibility, MdVisibilityOff } from "react-icons/md";

const PasswordCredentialsModal = ({ isOpen, onClose, credentials }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState({ username: false, password: false });

    if (!isOpen || !credentials) return null;

    const copyToClipboard = async (text, type) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied({ ...copied, [type]: true });
            setTimeout(() => {
                setCopied({ ...copied, [type]: false });
            }, 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    const handleClose = () => {
        setShowPassword(false);
        setCopied({ username: false, password: false });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose}></div>

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white dark:bg-navy-800 rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                <span className="text-green-600 dark:text-green-400 text-lg">🔑</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-navy-700 dark:text-white">
                                    Password Reset Successful
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    New credentials generated
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <MdClose size={24} />
                        </button>
                    </div>

                    {/* Organization Info */}
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-navy-900 rounded-xl">
                        <h4 className="font-medium text-navy-700 dark:text-white mb-1">
                            Organization
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {credentials.organization_name}
                        </p>
                    </div>

                    {/* Credentials */}
                    <div className="space-y-4 mb-6">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-navy-700 dark:text-white mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={credentials.owner_username}
                                    readOnly
                                    className="w-full px-4 py-3 pr-20 bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-mono focus:outline-none"
                                />
                                <button
                                    onClick={() => copyToClipboard(credentials.owner_username, 'username')}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 transition-colors"
                                    title="Copy username"
                                >
                                    {copied.username ? (
                                        <span className="text-green-600 text-xs font-medium">✓ Copied</span>
                                    ) : (
                                        <MdContentCopy size={16} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-navy-700 dark:text-white mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={credentials.new_password}
                                    readOnly
                                    className="w-full px-4 py-3 pr-32 bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-mono focus:outline-none"
                                />
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(credentials.new_password, 'password')}
                                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                                        title="Copy password"
                                    >
                                        {copied.password ? (
                                            <span className="text-green-600 text-xs font-medium">✓</span>
                                        ) : (
                                            <MdContentCopy size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <div className="flex items-start space-x-3">
                            <span className="text-amber-600 dark:text-amber-400 text-lg flex-shrink-0">⚠️</span>
                            <div>
                                <h5 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                                    Security Instructions
                                </h5>
                                <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                                    <li>• Share these credentials securely with the organization owner</li>
                                    <li>• Ask them to change the password after first login</li>
                                    <li>• Do not share these credentials via unsecured channels</li>
                                    <li>• This password will not be shown again</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => {
                                copyToClipboard(`Username: ${credentials.owner_username}\nPassword: ${credentials.new_password}`, 'both');
                            }}
                            className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
                        >
                            📋 Copy All
                        </button>
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordCredentialsModal;
