import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MdGames, 
  MdAccountCircle, 
  MdEdit,
  MdArrowBack,
  MdSave,
  MdCancel
} from "react-icons/md";

const PlayerProfile = () => {
  const [playerData, setPlayerData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    preferences: {
      notifications: true,
      gameReminders: false
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if player is authenticated
    const authData = localStorage.getItem('playerAuth');
    if (!authData) {
      navigate('/player/login');
      return;
    }

    const playerInfo = JSON.parse(authData);
    setPlayerData(playerInfo);
    
    // Load saved profile data if exists
    const profileData = localStorage.getItem(`playerProfile_${playerInfo.phone}`);
    if (profileData) {
      const profile = JSON.parse(profileData);
      setFormData(profile);
    }
  }, [navigate]);

  const handleSave = () => {
    // Save profile data to localStorage
    localStorage.setItem(`playerProfile_${playerData.phone}`, JSON.stringify(formData));
    
    // Update player auth with name
    const updatedPlayerData = {
      ...playerData,
      name: formData.name
    };
    localStorage.setItem('playerAuth', JSON.stringify(updatedPlayerData));
    setPlayerData(updatedPlayerData);
    
    setEditing(false);
  };

  const handleCancel = () => {
    // Reset form data
    const profileData = localStorage.getItem(`playerProfile_${playerData.phone}`);
    if (profileData) {
      setFormData(JSON.parse(profileData));
    }
    setEditing(false);
  };

  if (!playerData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/player/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <MdArrowBack className="text-lg" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <MdGames className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Player Profile</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <MdAccountCircle className="text-5xl text-gray-400" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {formData.name || `Player ${playerData.phone.slice(-4)}`}
                </h2>
                <p className="text-gray-600">+91 {playerData.phone}</p>
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <MdEdit className="text-lg" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {editing ? (
            /* Edit Form */
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Preferences
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferences.notifications}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          notifications: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      Receive notifications about sessions
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferences.gameReminders}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          gameReminders: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      Game session reminders
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                >
                  <MdSave className="text-lg" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                >
                  <MdCancel className="text-lg" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Name</h3>
                  <p className="text-gray-800">{formData.name || "Not set"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Email</h3>
                  <p className="text-gray-800">{formData.email || "Not set"}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Preferences</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Notifications</span>
                    <span className={`text-sm font-medium ${
                      formData.preferences.notifications ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {formData.preferences.notifications ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Game Reminders</span>
                    <span className={`text-sm font-medium ${
                      formData.preferences.gameReminders ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {formData.preferences.gameReminders ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Phone Number</span>
              <span className="font-medium">+91 {playerData.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Member Since</span>
              <span className="font-medium">
                {new Date(playerData.loginTime).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Account Type</span>
              <span className="font-medium">Player</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
