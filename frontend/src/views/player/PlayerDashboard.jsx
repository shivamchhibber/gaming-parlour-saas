import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    MdGames,
    MdHistory,
    MdAccountCircle,
    MdExitToApp,
    MdAccessTime,
    MdAttachMoney,
    MdTableChart,
    MdQrCodeScanner,
    MdPlayArrow,
    MdStop,
    MdPayment,
    MdSkipNext
} from "react-icons/md";
import axios from "axios";
import { buildApiUrl, API_ENDPOINTS } from "../../config/api";
import PaymentModal from "components/modal/PaymentModal";
import Toast from "components/notifications/Toast";
import ConfirmationModal from "components/modal/ConfirmationModal";

const PlayerDashboard = () => {
    const [playerData, setPlayerData] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [bill, setBill] = useState(null);

    // QR Scanner & Session Start
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [tableId, setTableId] = useState("");
    const [tableInfo, setTableInfo] = useState(null);
    const [startingSession, setStartingSession] = useState(false);

    // Payment
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);

    // UI States
    const [toast, setToast] = useState({ show: false, message: "", type: "info" });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Check if player is authenticated
        const authData = localStorage.getItem('playerAuth');
        if (!authData) {
            navigate('/player/login');
            return;
        }

        const playerInfo = JSON.parse(authData);
        setPlayerData(playerInfo);
        fetchPlayerSessions(playerInfo.phone);
        checkActiveSession(playerInfo.phone);

        // Handle QR scan redirect with table info
        if (location.state?.tableId && location.state?.autoStart) {
            const incomingTableId = String(location.state.tableId);
            setTableId(incomingTableId);
            // Auto-lookup table after component loads
            setTimeout(() => {
                handleTableLookup(incomingTableId);
            }, 500);
        }
    }, [navigate, location.state]);

    // Timer for active session
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchPlayerSessions = async (phoneNumber) => {
        try {
            setLoading(true);

            // Fetch real data from API
            const response = await axios.get(buildApiUrl(`${API_ENDPOINTS.PLAYER_SESSIONS}/${phoneNumber}`));
            console.log('✅ Player sessions fetched:', response.data);
            setSessions(response.data.sessions || []);

            // Show success toast if data received
            if (response.data.sessions && response.data.sessions.length > 0) {
                setToast({
                    show: true,
                    message: `✅ Loaded ${response.data.sessions.length} gaming sessions`,
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('❌ Error fetching sessions:', error);

            // Show error details in toast
            setToast({
                show: true,
                message: `❌ Failed to load gaming history: ${error.response?.data?.detail || error.message}`,
                type: 'error'
            });

            // Set empty array so UI doesn't break
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const checkActiveSession = async (phoneNumber) => {
        try {
            // Check if there's an active session for this player
            const response = await axios.get(buildApiUrl(`${API_ENDPOINTS.PLAYER_ACTIVE_SESSION}/${phoneNumber}`));
            if (response.data.active_session) {
                setActiveSession(response.data.active_session);
            }
        } catch (error) {
            // No active session found
            console.log('No active session found');
        }
    };

    const handleTableLookup = async (lookupTableId = null) => {
        const targetTableId = lookupTableId || tableId;

        // Convert to string and trim
        const tableIdString = String(targetTableId || '').trim();

        if (!tableIdString) {
            setToast({
                show: true,
                message: 'Please enter a table number',
                type: 'error'
            });
            return;
        }

        try {
            // For now, only support numeric table IDs until backend is restarted
            if (!/^\d+$/.test(tableIdString)) {
                setToast({
                    show: true,
                    message: `⚠️ Currently only numeric table IDs are supported. Table "${tableIdString}" should be looked up by its ID number. Please contact staff for the table ID.`,
                    type: 'error'
                });
                return;
            }

            const response = await axios.get(buildApiUrl(`${API_ENDPOINTS.TABLE_DETAILS}/${tableIdString}`));
            setTableInfo(response.data);

            // If coming from QR scan, show special message
            if (lookupTableId) {
                setToast({
                    show: true,
                    message: `🎯 QR Scan detected! Table ${response.data.table_number} ready - ₹${response.data.rate_per_hour}/hour`,
                    type: 'success'
                });
            } else {
                setToast({
                    show: true,
                    message: `Table ${response.data.table_number} found - ₹${response.data.rate_per_hour}/hour`,
                    type: 'success'
                });
            }
        } catch (error) {
            setToast({
                show: true,
                message: 'Table not found. Please check the table number.',
                type: 'error'
            });
            setTableInfo(null);
        }
    };

    const handleStartSession = async () => {
        if (!tableInfo) {
            setToast({
                show: true,
                message: 'Please find a table first',
                type: 'error'
            });
            return;
        }

        setStartingSession(true);
        try {
            const response = await axios.post(buildApiUrl(API_ENDPOINTS.SESSION_START), {
                name: playerData.name || `Player ${playerData.phone.slice(-4)}`,
                phone: playerData.phone,
                table_id: parseInt(tableId),
            });

            setActiveSession(response.data);
            setTableInfo(null);
            setTableId("");
            setActiveTab('active');

            setToast({
                show: true,
                message: `Gaming session started at Table ${tableInfo.table_number}!`,
                type: 'success'
            });
        } catch (error) {
            setToast({
                show: true,
                message: error.response?.data?.detail || 'Error starting session',
                type: 'error'
            });
        } finally {
            setStartingSession(false);
        }
    };

    const handleEndSession = async () => {
        if (!activeSession) return;

        try {
            const response = await axios.post(buildApiUrl(API_ENDPOINTS.SESSION_END), {
                session_id: activeSession.session_id,
            });

            setBill(response.data);
            setActiveSession(null);
            setActiveTab('payment');

            // Refresh sessions list
            fetchPlayerSessions(playerData.phone);
        } catch (error) {
            setToast({
                show: true,
                message: error.response?.data?.detail || 'Error ending session',
                type: 'error'
            });
        }
    };

    const handlePayment = async () => {
        if (!bill) return;

        setPaymentLoading(true);
        try {
            const response = await axios.post(buildApiUrl(API_ENDPOINTS.PAYMENT_SESSION), {
                session_id: bill.session_id
            });

            setPaymentData(response.data);
            setShowPaymentModal(true);
            setPaymentLoading(false);
        } catch (error) {
            setPaymentLoading(false);
            setToast({
                show: true,
                message: 'Payment service temporarily unavailable. Please try again.',
                type: 'error'
            });
        }
    };

    const handlePaymentSuccess = (paymentResponse) => {
        console.log('Payment successful:', paymentResponse);
        setShowPaymentModal(false);
        setBill(null);
        setActiveTab('home');

        setToast({
            show: true,
            message: '🎉 Payment successful! Session completed.',
            type: 'success'
        });

        // Refresh sessions
        fetchPlayerSessions(playerData.phone);
    };

    const handleSkipPayment = () => {
        setConfirmAction(() => () => {
            axios.post(buildApiUrl(API_ENDPOINTS.SESSION_MARK_UNPAID), {
                session_id: bill.session_id
            }).then(() => {
                setBill(null);
                setActiveTab('home');
                setToast({
                    show: true,
                    message: 'Session marked as unpaid. You can pay later at the counter.',
                    type: 'info'
                });
                fetchPlayerSessions(playerData.phone);
            });
        });
        setShowConfirmModal(true);
    };

    const formatDuration = (startTime) => {
        const start = new Date(startTime);
        const diff = currentTime - start;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    const calculateCurrentCharge = () => {
        if (!activeSession || !tableInfo) return 0;
        const start = new Date(activeSession.start_time);
        const diff = currentTime - start;
        const hours = diff / (1000 * 60 * 60);
        return (hours * (tableInfo.rate_per_hour || 240)).toFixed(2);
    };

    const handleLogout = () => {
        localStorage.removeItem('playerAuth');
        navigate('/player/login');
    };

    const getTotalSpent = () => {
        return sessions
            .filter(session => session.payment_status === 'paid')
            .reduce((total, session) => total + session.total_charge, 0);
    };

    const getTotalPlayTime = () => {
        return sessions.reduce((total, session) => total + session.duration_minutes, 0);
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
            <div className="bg-white shadow-sm border-b relative z-10">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <MdGames className="text-white text-lg" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">Game Parlour</h1>
                                <p className="text-sm text-gray-600">Welcome, {playerData.name || `Player ${playerData.phone.slice(-4)}`}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => navigate('/player/profile')}
                                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <MdAccountCircle className="text-lg" />
                                <span>Profile</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <MdExitToApp className="text-lg" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6 max-w-md">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'home'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        🏠 Home
                    </button>
                    {activeSession && (
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'active'
                                ? 'bg-white text-green-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            🎮 Active
                        </button>
                    )}
                    {bill && (
                        <button
                            onClick={() => setActiveTab('payment')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'payment'
                                ? 'bg-white text-orange-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            💳 Payment
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'history'
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        📋 History
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'home' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <MdAttachMoney className="text-green-600 text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Spent</p>
                                        <p className="text-2xl font-bold text-gray-800">₹{getTotalSpent()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <MdAccessTime className="text-blue-600 text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Play Time</p>
                                        <p className="text-2xl font-bold text-gray-800">{Math.floor(getTotalPlayTime() / 60)}h {getTotalPlayTime() % 60}m</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                        <MdTableChart className="text-purple-600 text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Sessions Played</p>
                                        <p className="text-2xl font-bold text-gray-800">{sessions.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Start New Session */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <MdQrCodeScanner className="mr-2 text-blue-500" />
                                Start New Gaming Session
                            </h3>

                            <div className="space-y-4">
                                <div className="flex space-x-3">
                                    <input
                                        type="text"
                                        value={tableId}
                                        onChange={(e) => setTableId(String(e.target.value))}
                                        placeholder="Enter table number (e.g., 1, PSP, VIP-1)"
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                    <button
                                        onClick={() => handleTableLookup()}
                                        className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                                    >
                                        Find Table
                                    </button>
                                </div>

                                {tableInfo && (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold text-blue-800">Table {tableInfo.table_number}</h4>
                                                <p className="text-blue-600">₹{tableInfo.rate_per_hour} per hour</p>
                                            </div>
                                            <button
                                                onClick={handleStartSession}
                                                disabled={startingSession}
                                                className={`px-6 py-3 rounded-xl font-semibold text-white transition-colors ${startingSession
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-green-500 hover:bg-green-600'
                                                    }`}
                                            >
                                                {startingSession ? 'Starting...' : '🎮 Start Session'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'active' && activeSession && (
                    <div className="space-y-6">
                        {/* Active Session Card */}
                        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold">🎮 Gaming Session Active</h3>
                                    <p className="text-green-100">Table {activeSession.table_number || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-mono font-bold">
                                        {formatDuration(activeSession.start_time)}
                                    </div>
                                    <p className="text-green-100 text-sm">Time Playing</p>
                                </div>
                            </div>
                        </div>

                        {/* Session Details */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h4 className="font-semibold text-gray-800 mb-4">Session Details</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Started At</p>
                                    <p className="font-semibold">{new Date(activeSession.start_time).toLocaleTimeString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Rate</p>
                                    <p className="font-semibold">₹{tableInfo?.rate_per_hour || 240}/hour</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Current Charge</p>
                                    <p className="font-semibold text-lg">₹{calculateCurrentCharge()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Action</p>
                                    <button
                                        onClick={handleEndSession}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                                    >
                                        🛑 End Session
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payment' && bill && (
                    <div className="space-y-6">
                        {/* Bill Summary */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="text-center mb-6">
                                <div className="text-4xl mb-4">🎉</div>
                                <h3 className="text-2xl font-bold text-green-600 mb-2">Session Completed!</h3>
                                <p className="text-gray-600">Review your session details below</p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 mb-6">
                                <h4 className="font-semibold text-gray-800 mb-4">📋 Session Bill</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Player:</span>
                                        <span className="font-medium">{bill.user_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Table:</span>
                                        <span className="font-medium">{bill.table_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Duration:</span>
                                        <span className="font-medium">{Math.floor(bill.duration_minutes / 60)}h {bill.duration_minutes % 60}m</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Rate:</span>
                                        <span className="font-medium">₹{bill.rate_per_hour}/hour</span>
                                    </div>
                                    <hr className="my-3" />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total Amount:</span>
                                        <span className="text-green-600">₹{bill.total_charge}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handlePayment}
                                    disabled={paymentLoading}
                                    className={`w-full py-4 rounded-xl font-semibold text-white transition-colors ${paymentLoading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-500 hover:bg-green-600'
                                        }`}
                                >
                                    {paymentLoading ? 'Processing...' : `💳 Pay ₹${bill.total_charge} with Razorpay`}
                                </button>

                                <button
                                    onClick={handleSkipPayment}
                                    className="w-full py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                                >
                                    Skip Payment & Pay Later
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                            <MdHistory className="mr-2 text-gray-600" />
                            Gaming History
                        </h3>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading your gaming history...</p>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-8">
                                <MdGames className="text-gray-400 text-5xl mx-auto mb-4" />
                                <p className="text-gray-600">No gaming sessions found</p>
                                <p className="text-gray-500 text-sm">Start playing to see your history here!</p>
                                <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
                                    <p><strong>Debug Info:</strong></p>
                                    <p>Player: {playerData?.phone}</p>
                                    <p>Sessions Array Length: {sessions.length}</p>
                                    <p>Loading: {loading ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessions.map((session) => (
                                    <div key={session.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h4 className="font-semibold text-gray-800">Table {session.table_number}</h4>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.payment_status === 'paid'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {session.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                                    <div>
                                                        <p className="font-medium">Start Time</p>
                                                        <p>{new Date(session.start_time).toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Duration</p>
                                                        <p>{Math.floor(session.duration_minutes / 60)}h {session.duration_minutes % 60}m</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Rate</p>
                                                        <p>₹{session.rate_per_hour}/hour</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Amount</p>
                                                        <p className="text-lg font-semibold text-gray-800">₹{session.total_charge}</p>
                                                    </div>
                                                </div>

                                                {session.payment_timestamp && (
                                                    <div className="mt-2">
                                                        <p className="text-xs text-green-600">
                                                            ✓ Paid on {new Date(session.payment_timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                paymentData={paymentData}
                onPaymentSuccess={handlePaymentSuccess}
            />

            {/* Toast Notifications */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.show}
                onClose={() => setToast({ ...toast, show: false })}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={() => {
                    confirmAction();
                    setShowConfirmModal(false);
                }}
                title="Skip Payment"
                message={`Are you sure you want to skip payment for ₹${bill?.total_charge}?\n\nYou can pay later at the counter.`}
                confirmText="Skip Payment"
                cancelText="Continue Payment"
                type="warning"
            />
        </div>
    );
};

export default PlayerDashboard;