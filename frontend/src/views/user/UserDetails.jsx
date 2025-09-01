import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MdPlayArrow, MdStop, MdAccessTime, MdAttachMoney } from "react-icons/md";
import axios from "axios";
import { buildApiUrl, API_ENDPOINTS } from "../../config/api";
import Toast from "components/notifications/Toast";

const UserDetails = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [error, setError] = useState("");

  const fetchTableInfo = async () => {
    try {
      const response = await axios.get(buildApiUrl(`${API_ENDPOINTS.TABLE_DETAILS}/${tableId}`));
      setTable(response.data);
      setLoading(false);
    } catch (error) {
      setError("Table not found");
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirect to login if accessed directly - we now require authentication
    const playerAuth = localStorage.getItem('playerAuth');
    if (!playerAuth) {
      navigate('/player/login', {
        state: { returnTo: `/user/scan/${tableId}`, tableId: tableId }
      });
      return;
    }

    fetchTableInfo();
  }, [tableId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await axios.post(buildApiUrl(API_ENDPOINTS.SESSION_START), {
        name: formData.name,
        phone: formData.phone,
        table_id: parseInt(tableId),
      });

      // Redirect to game session page
      navigate(`/user/session/${response.data.session_id}`);
    } catch (error) {
      setError(error.response?.data?.detail || "Error starting session");
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !table) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="mb-4 text-2xl font-bold text-red-600">Error</h2>
            <p className="mb-6 text-gray-600">{error}</p>
            <button
              onClick={() => window.location.href = "/admin"}
              className="w-full rounded-lg bg-blue-500 py-3 text-white hover:bg-blue-600"
            >
              Go to Admin Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Form Card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">👤</div>
            <h1 className="mb-2 text-2xl font-bold text-gray-800">
              Guest Session (Backup)
            </h1>
            <p className="mb-2 text-lg font-semibold text-blue-600">
              Table {table?.table_number} - ₹{table?.rate_per_hour}/hour
            </p>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                ⚠️ <strong>Note:</strong> This is a backup form. For the best experience with session history and quick payments, please use the player login system.
              </p>
            </div>
            <p className="text-gray-600">
              Provide your details for this one-time session
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
                disabled={submitting}
                className="w-full rounded-lg border-2 border-gray-200 p-4 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="Enter your phone number"
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit phone number"
                disabled={submitting}
                className="w-full rounded-lg border-2 border-gray-200 p-4 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-green-500 py-4 text-lg font-semibold text-white hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Starting Session..." : "Start Gaming Session"}
            </button>
          </form>

          <div className="mt-4 space-y-3">
            <button
              onClick={() => navigate(`/user/scan/${tableId}`)}
              className="w-full rounded-lg bg-gray-500 py-3 text-white hover:bg-gray-600 transition-colors"
            >
              Back to Table Info
            </button>

            <div className="text-center">
              <button
                onClick={() => navigate('/player/login', {
                  state: { returnTo: `/user/scan/${tableId}`, tableId: tableId }
                })}
                className="w-full py-2 text-blue-500 hover:text-blue-700 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                🔐 Switch to Player Login (Recommended)
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-3 text-lg font-bold text-gray-800">🔒 Privacy Notice</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your personal information is used only for session management and billing purposes.
            We do not share your details with third parties and data is stored securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
