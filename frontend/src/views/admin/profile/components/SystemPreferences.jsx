import React, { useState, useEffect } from "react";
import Card from "components/card";
import { MdSettings, MdNotifications, MdDarkMode, MdLanguage, MdAccessTime } from "react-icons/md";

const SystemPreferences = () => {
    const [preferences, setPreferences] = useState({
        darkMode: false,
        notifications: {
            newSessions: true,
            lowRevenue: true,
            systemUpdates: false,
            emailNotifications: true,
        },
        language: "en",
        timezone: "Asia/Kolkata",
        autoRefresh: true,
        refreshInterval: 30,
    });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");

    useEffect(() => {
        // Load preferences from localStorage
        const savedPreferences = localStorage.getItem('adminPreferences');
        if (savedPreferences) {
            setPreferences(JSON.parse(savedPreferences));
        }
    }, []);

    const handleToggle = (key, subKey = null) => {
        setPreferences(prev => {
            const newPrefs = { ...prev };
            if (subKey) {
                newPrefs[key] = {
                    ...newPrefs[key],
                    [subKey]: !newPrefs[key][subKey]
                };
            } else {
                newPrefs[key] = !newPrefs[key];
            }
            return newPrefs;
        });
    };

    const handleSelectChange = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const savePreferences = async () => {
        setSaving(true);

        // Save to localStorage
        localStorage.setItem('adminPreferences', JSON.stringify(preferences));

        // Apply dark mode immediately
        if (preferences.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        setSuccess("Preferences saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
        setSaving(false);
    };

    return (
        <Card extra="w-full h-full p-6">
            {/* Header */}
            <div className="mb-6">
                <h4 className="text-xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
                    <MdSettings className="h-5 w-5" />
                    System Preferences
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Customize your dashboard experience and system settings
                </p>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-4 rounded-lg bg-green-100 border border-green-400 text-green-700 px-4 py-3">
                    {success}
                </div>
            )}

            <div className="space-y-6">
                {/* Appearance Settings */}
                <div>
                    <h5 className="text-lg font-semibold text-navy-700 dark:text-white mb-4 flex items-center gap-2">
                        <MdDarkMode className="h-4 w-4" />
                        Appearance
                    </h5>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Switch to dark theme</p>
                            </div>
                            <button
                                onClick={() => handleToggle('darkMode')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.darkMode ? 'bg-brand-500' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.darkMode ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Language</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Select your preferred language</p>
                            </div>
                            <select
                                value={preferences.language}
                                onChange={(e) => handleSelectChange('language', e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-brand-500 focus:outline-none dark:bg-navy-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="en">English</option>
                                <option value="hi">हिंदी</option>
                                <option value="es">Español</option>
                                <option value="fr">Français</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Timezone</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Your local timezone</p>
                            </div>
                            <select
                                value={preferences.timezone}
                                onChange={(e) => handleSelectChange('timezone', e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-brand-500 focus:outline-none dark:bg-navy-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                <option value="America/New_York">America/New_York (EST)</option>
                                <option value="Europe/London">Europe/London (GMT)</option>
                                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div>
                    <h5 className="text-lg font-semibold text-navy-700 dark:text-white mb-4 flex items-center gap-2">
                        <MdNotifications className="h-4 w-4" />
                        Notifications
                    </h5>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">New Gaming Sessions</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Get notified when new sessions start</p>
                            </div>
                            <button
                                onClick={() => handleToggle('notifications', 'newSessions')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.notifications.newSessions ? 'bg-brand-500' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.notifications.newSessions ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Revenue Alerts</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Alert when daily revenue is low</p>
                            </div>
                            <button
                                onClick={() => handleToggle('notifications', 'lowRevenue')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.notifications.lowRevenue ? 'bg-brand-500' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.notifications.lowRevenue ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                            </div>
                            <button
                                onClick={() => handleToggle('notifications', 'emailNotifications')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.notifications.emailNotifications ? 'bg-brand-500' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Settings */}
                <div>
                    <h5 className="text-lg font-semibold text-navy-700 dark:text-white mb-4 flex items-center gap-2">
                        <MdAccessTime className="h-4 w-4" />
                        System Settings
                    </h5>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Auto Refresh Dashboard</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Automatically refresh data every few seconds</p>
                            </div>
                            <button
                                onClick={() => handleToggle('autoRefresh')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.autoRefresh ? 'bg-brand-500' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {preferences.autoRefresh && (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Refresh Interval</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">How often to refresh data (seconds)</p>
                                </div>
                                <select
                                    value={preferences.refreshInterval}
                                    onChange={(e) => handleSelectChange('refreshInterval', parseInt(e.target.value))}
                                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-brand-500 focus:outline-none dark:bg-navy-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value={10}>10 seconds</option>
                                    <option value={30}>30 seconds</option>
                                    <option value={60}>1 minute</option>
                                    <option value={300}>5 minutes</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                    onClick={savePreferences}
                    disabled={saving}
                    className="w-full rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600 transition-colors disabled:bg-gray-400"
                >
                    {saving ? "Saving..." : "Save Preferences"}
                </button>
            </div>
        </Card>
    );
};

export default SystemPreferences;
