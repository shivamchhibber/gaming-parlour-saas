import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdQrCodeScanner, MdPlayArrow, MdStop, MdAccessTime, MdAttachMoney } from "react-icons/md";
import axios from "axios";
import { buildApiUrl, API_ENDPOINTS } from "../../config/api";
import Toast from "components/notifications/Toast";

const TableScan = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const [table, setTable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchTableInfo = async () => {
        try {
            const response = await axios.get(buildApiUrl(`${API_ENDPOINTS.TABLE_DETAILS}/${tableId}`));
            setTable(response.data);
            setLoading(false);
        } catch (error) {
            setError("Table not found or invalid QR code");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTableInfo();
    }, [tableId]);

    const handleStartSession = () => {
        // Check if player is already logged in
        const playerAuth = localStorage.getItem('playerAuth');
        if (playerAuth) {
            // Player is logged in, redirect to dashboard with table info
            navigate('/player/dashboard', {
                state: { tableId: tableId, autoStart: true }
            });
        } else {
            // Player must login first
            navigate('/player/login', {
                state: { returnTo: `/user/scan/${tableId}`, tableId: tableId }
            });
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p className="text-lg text-gray-600">Loading table information...</p>
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
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
                <div className="text-center">
                    <div className="text-6xl mb-6">🎮</div>
                    <h1 className="mb-4 text-3xl font-bold text-gray-800">
                        Table {table.table_number}
                    </h1>
                    <p className="mb-6 text-2xl font-bold text-blue-600">
                        ₹{table.rate_per_hour} per hour
                    </p>
                    <p className="mb-6 text-gray-600 leading-relaxed">
                        Welcome to our gaming table! Please login to start your gaming session.
                    </p>

                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <h4 className="font-semibold text-blue-800 mb-2">📱 Player Login Required</h4>
                        <p className="text-sm text-blue-700">
                            All players must authenticate to track sessions, payments, and build gaming history.
                        </p>
                    </div>

                    <button
                        onClick={handleStartSession}
                        className="w-full rounded-lg bg-blue-500 py-4 text-lg font-semibold text-white hover:bg-blue-600 transition-colors"
                    >
                        🔐 Login & Start Gaming
                    </button>
                </div>
            </div>

            {/* Guidelines Card */}
            <div className="fixed bottom-4 left-4 right-4 md:relative md:mt-8 md:w-full md:max-w-md">
                <div className="rounded-xl bg-white p-6 shadow-lg">
                    <h3 className="mb-4 text-lg font-bold text-gray-800">📋 Session Guidelines</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start">
                            <span className="mr-2 text-blue-500">📱</span>
                            Login with phone number + OTP verification
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2 text-green-500">✓</span>
                            Gaming time tracked automatically in your account
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2 text-green-500">✓</span>
                            Session history saved for future reference
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2 text-green-500">✓</span>
                            Secure payment with auto-redirect to dashboard
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default TableScan;
