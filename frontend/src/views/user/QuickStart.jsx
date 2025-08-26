import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MdGames, MdAccountCircle, MdTableChart, MdAccessTime } from "react-icons/md";
import axios from "axios";

const QuickStart = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const fetchTableInfo = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:8000/table/${tableId}`);
      setTable(response.data);
    } catch (error) {
      setError("Table not found or invalid QR code");
    }
  }, [tableId]);

  useEffect(() => {
    // Check if player is authenticated
    const authData = localStorage.getItem('playerAuth');
    if (!authData) {
      navigate('/player/login');
      return;
    }

    const playerInfo = JSON.parse(authData);
    setPlayer(playerInfo);
    fetchTableInfo();
    setLoading(false);
  }, [navigate, fetchTableInfo]);

  const handleStartSession = async () => {
    setStarting(true);
    setError("");

    try {
      // Get player name from previous sessions or use phone
      let playerName = player.name || `Player ${player.phone.slice(-4)}`;
      
      const response = await axios.post("http://localhost:8000/session/start", {
        name: playerName,
        phone: player.phone,
        table_id: parseInt(tableId),
      });

      // Redirect to game session page
      navigate(`/user/session/${response.data.session_id}`);
    } catch (error) {
      setError(error.response?.data?.detail || "Error starting session");
      setStarting(false);
    }
  };

  const handleManualEntry = () => {
    // Go to normal details form
    navigate(`/user/details/${tableId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('playerAuth');
    navigate(`/user/scan/${tableId}`);
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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="mb-4 text-2xl font-bold text-red-600">Error</h2>
            <p className="mb-6 text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/player/dashboard')}
              className="w-full rounded-lg bg-blue-500 py-3 text-white hover:bg-blue-600"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Welcome Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <MdGames className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Quick Start</h1>
          <p className="text-gray-600">Ready to start gaming?</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-4">
          {/* Player Info */}
          <div className="flex items-center space-x-3 mb-6 p-4 bg-blue-50 rounded-xl">
            <MdAccountCircle className="text-blue-500 text-3xl" />
            <div>
              <p className="font-semibold text-gray-800">Welcome back!</p>
              <p className="text-sm text-gray-600">+91 {player?.phone}</p>
            </div>
          </div>

          {/* Table Info */}
          <div className="flex items-center justify-between mb-6 p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <MdTableChart className="text-purple-500 text-2xl" />
              <div>
                <p className="font-bold text-gray-800">Table {table?.table_number}</p>
                <p className="text-sm text-gray-600">Premium Gaming</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">₹{table?.rate_per_hour}</p>
              <p className="text-xs text-gray-500">per hour</p>
            </div>
          </div>

          {/* Quick Start Info */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <MdAccessTime className="text-green-600" />
              <p className="text-sm font-medium text-green-800">Quick Start Benefits</p>
            </div>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• No need to enter details again</li>
              <li>• Session history automatically tracked</li>
              <li>• Faster checkout process</li>
            </ul>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleStartSession}
              disabled={starting}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-colors ${
                starting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {starting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Starting Session...
                </div>
              ) : (
                '🚀 Start Gaming Session'
              )}
            </button>

            <button
              onClick={handleManualEntry}
              className="w-full py-3 text-blue-500 hover:text-blue-600 font-medium border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Use Different Details
            </button>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between text-sm">
            <button
              onClick={() => navigate('/player/dashboard')}
              className="text-gray-500 hover:text-gray-700"
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Gaming Guidelines */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <MdGames className="mr-2 text-blue-500" />
            Ready to Play?
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>Session auto-tracked</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>Easy payment</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>History saved</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>Loyalty rewards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStart;
