import React, { useState } from "react";
import ProfileForm from "./components/ProfileForm";
import SecuritySettings from "./components/SecuritySettings";
import SystemPreferences from "./components/SystemPreferences";
import { MdPerson, MdLock, MdSettings } from "react-icons/md";

const ProfileOverview = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: MdPerson },
    { id: "security", label: "Security", icon: MdLock },
    { id: "preferences", label: "Preferences", icon: MdSettings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileForm />;
      case "security":
        return <SecuritySettings />;
      case "preferences":
        return <SystemPreferences />;
      default:
        return <ProfileForm />;
    }
  };

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Header */}
      <div className="rounded-[20px] bg-white p-6 shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none">
        <h1 className="text-2xl font-bold text-navy-700 dark:text-white mb-2">
          Account Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your profile, security settings, and system preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="rounded-[20px] bg-white shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none">
        <div className="flex border-b border-gray-200 dark:border-gray-600">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === tab.id
                    ? "border-b-2 border-brand-500 text-brand-500"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
              >
                <IconComponent className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {renderContent()}
      </div>
    </div>
  );
};

export default ProfileOverview;
