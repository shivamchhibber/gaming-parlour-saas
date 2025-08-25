import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const TableScan = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const [table, setTable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchTableInfo = useCallback(async () => {
        try {
            const response = await axios.get(`http://localhost:8000/table/${tableId}`);
            setTable(response.data);
            setLoading(false);
        } catch (error) {
            setError("Table not found or invalid QR code");
            setLoading(false);
        }
    }, [tableId]);

    useEffect(() => {
        fetchTableInfo();
    }, [fetchTableInfo]);

    const handleStartSession = () => {
        navigate(`/user/details/${tableId}`);
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
                    <p className="mb-8 text-gray-600 leading-relaxed">
                        Welcome to our gaming table! Click below to start your gaming session.
                    </p>
                    <button
                        onClick={handleStartSession}
                        className="w-full rounded-lg bg-green-500 py-4 text-lg font-semibold text-white hover:bg-green-600 transition-colors"
                    >
                        Start Gaming Session
                    </button>
                </div>
            </div>

            {/* Guidelines Card */}
            <div className="fixed bottom-4 left-4 right-4 md:relative md:mt-8 md:w-full md:max-w-md">
                <div className="rounded-xl bg-white p-6 shadow-lg">
                    <h3 className="mb-4 text-lg font-bold text-gray-800">📋 Session Guidelines</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start">
                            <span className="mr-2 text-green-500">✓</span>
                            Provide your name and phone number to start
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2 text-green-500">✓</span>
                            Gaming time tracked automatically
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2 text-green-500">✓</span>
                            End session anytime through the app
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2 text-green-500">✓</span>
                            Payment calculated based on actual time
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default TableScan;
