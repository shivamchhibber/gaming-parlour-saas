import React, { useState, useEffect } from "react";
import axios from "axios";
import { MdQrCodeScanner, MdPerson, MdAccessTime, MdAttachMoney } from "react-icons/md";

import Card from "components/card";
import InputField from "components/fields/InputField";

const UserInterface = () => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [userDetails, setUserDetails] = useState({
        name: "",
        phone: "",
    });
    const [currentSession, setCurrentSession] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Select Table, 2: User Details, 3: Active Session, 4: Session Complete

    useEffect(() => {
        fetchTables();
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchTables = async () => {
        try {
            const response = await axios.get("http://localhost:8000/admin/tables");
            setTables(response.data);
        } catch (error) {
            console.error("Error fetching tables:", error);
        }
    };

    const handleTableSelect = async (table) => {
        setSelectedTable(table);
        setStep(2);
    };

    const handleStartSession = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post("http://localhost:8000/session/start", {
                name: userDetails.name,
                phone: userDetails.phone,
                table_id: selectedTable.id,
            });

            setCurrentSession({
                ...response.data,
                table: selectedTable,
                user_name: userDetails.name,
                user_phone: userDetails.phone,
            });
            setStep(3);
        } catch (error) {
            alert(error.response?.data?.detail || "Error starting session");
        }
        setLoading(false);
    };

    const handleEndSession = async () => {
        setLoading(true);
        try {
            const response = await axios.post("http://localhost:8000/session/end", {
                session_id: currentSession.session_id,
            });

            setCurrentSession(response.data);
            setStep(4);
        } catch (error) {
            alert(error.response?.data?.detail || "Error ending session");
        }
        setLoading(false);
    };

    const resetFlow = () => {
        setSelectedTable(null);
        setUserDetails({ name: "", phone: "" });
        setCurrentSession(null);
        setStep(1);
    };

    const formatDuration = (startTime) => {
        const start = new Date(startTime);
        const diff = currentTime - start;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    const calculateCurrentCharge = () => {
        if (!currentSession || !selectedTable) return 0;
        const start = new Date(currentSession.start_time);
        const diff = currentTime - start;
        const hours = diff / (1000 * 60 * 60);
        return (hours * selectedTable.rate_per_hour).toFixed(2);
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
                    📱 User Interface Test
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Test the complete user experience flow from QR scanning to session completion
                </p>
            </div>

            {/* Progress Steps */}
            <Card extra="mb-5">
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3, 4].map((stepNum) => (
                            <div key={stepNum} className="flex items-center">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= stepNum
                                            ? "bg-brand-500 text-white"
                                            : "bg-gray-200 text-gray-500"
                                        }`}
                                >
                                    {stepNum}
                                </div>
                                {stepNum < 4 && (
                                    <div
                                        className={`h-1 w-16 ${step > stepNum ? "bg-brand-500" : "bg-gray-200"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-between text-sm text-gray-600">
                        <span>Select Table</span>
                        <span>Enter Details</span>
                        <span>Gaming Session</span>
                        <span>Complete</span>
                    </div>
                </div>
            </Card>

            {/* Step 1: Table Selection */}
            {step === 1 && (
                <Card>
                    <div className="p-6">
                        <div className="mb-6 text-center">
                            <MdQrCodeScanner className="mx-auto mb-4 h-16 w-16 text-brand-500" />
                            <h2 className="mb-2 text-xl font-bold text-navy-700 dark:text-white">
                                Scan QR Code or Select Table
                            </h2>
                            <p className="text-gray-600">
                                In real usage, users would scan the QR code on their table. For testing, select a table below:
                            </p>
                        </div>

                        {tables.length === 0 ? (
                            <div className="text-center">
                                <p className="text-gray-500">No tables available. Please create some tables first.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {tables.map((table) => (
                                    <div
                                        key={table.id}
                                        onClick={() => handleTableSelect(table)}
                                        className="cursor-pointer rounded-lg border-2 border-gray-200 p-4 transition-all hover:border-brand-500 hover:shadow-lg"
                                    >
                                        <div className="text-center">
                                            <h3 className="mb-2 text-lg font-bold text-navy-700">
                                                Table {table.table_number}
                                            </h3>
                                            <p className="mb-3 text-brand-500 font-semibold">
                                                ₹{table.rate_per_hour}/hour
                                            </p>
                                            <img
                                                src={table.qr_code}
                                                alt={`QR Code for Table ${table.table_number}`}
                                                className="mx-auto h-24 w-24 rounded"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Step 2: User Details */}
            {step === 2 && selectedTable && (
                <Card>
                    <div className="p-6">
                        <div className="mb-6 text-center">
                            <MdPerson className="mx-auto mb-4 h-16 w-16 text-brand-500" />
                            <h2 className="mb-2 text-xl font-bold text-navy-700 dark:text-white">
                                Enter Your Details
                            </h2>
                            <p className="mb-4 text-brand-500 font-semibold">
                                Table {selectedTable.table_number} - ₹{selectedTable.rate_per_hour}/hour
                            </p>
                            <p className="text-gray-600">
                                Please provide your details to start the gaming session
                            </p>
                        </div>

                        <form onSubmit={handleStartSession} className="mx-auto max-w-md">
                            <div className="space-y-4">
                                <InputField
                                    label="Full Name"
                                    placeholder="Enter your full name"
                                    value={userDetails.name}
                                    onChange={(e) =>
                                        setUserDetails({ ...userDetails, name: e.target.value })
                                    }
                                    required
                                />
                                <InputField
                                    label="Phone Number"
                                    placeholder="Enter your phone number"
                                    type="tel"
                                    value={userDetails.phone}
                                    onChange={(e) =>
                                        setUserDetails({ ...userDetails, phone: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 rounded-lg bg-brand-500 py-3 text-white hover:bg-brand-600 disabled:opacity-50"
                                >
                                    {loading ? "Starting Session..." : "Start Gaming Session"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="rounded-lg bg-gray-500 px-6 py-3 text-white hover:bg-gray-600"
                                >
                                    Back
                                </button>
                            </div>
                        </form>
                    </div>
                </Card>
            )}

            {/* Step 3: Active Session */}
            {step === 3 && currentSession && selectedTable && (
                <Card>
                    <div className="p-6">
                        <div className="mb-6 text-center">
                            <MdAccessTime className="mx-auto mb-4 h-16 w-16 text-green-500" />
                            <h2 className="mb-2 text-xl font-bold text-navy-700 dark:text-white">
                                Gaming Session Active
                            </h2>
                            <p className="text-gray-600">
                                Hello <strong>{userDetails.name}</strong>! You're playing at Table{" "}
                                <strong>{selectedTable.table_number}</strong>
                            </p>
                        </div>

                        <div className="mx-auto max-w-md rounded-lg bg-gray-50 p-6 text-center dark:bg-navy-700">
                            <div className="mb-4 text-4xl font-bold text-brand-500">
                                {formatDuration(currentSession.start_time)}
                            </div>
                            <p className="mb-2 text-gray-600">
                                Session started at: {new Date(currentSession.start_time).toLocaleTimeString()}
                            </p>
                            <p className="mb-4 text-xl font-bold text-green-600">
                                Current Charge: ₹{calculateCurrentCharge()}
                            </p>
                            <p className="text-sm text-gray-600">
                                Rate: ₹{selectedTable.rate_per_hour}/hour
                            </p>
                        </div>

                        <div className="mt-6 text-center">
                            <button
                                onClick={handleEndSession}
                                disabled={loading}
                                className="rounded-lg bg-red-500 px-8 py-3 text-white hover:bg-red-600 disabled:opacity-50"
                            >
                                {loading ? "Ending Session..." : "End Session & Calculate Bill"}
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Step 4: Session Complete */}
            {step === 4 && currentSession && selectedTable && (
                <Card>
                    <div className="p-6">
                        <div className="mb-6 text-center">
                            <MdAttachMoney className="mx-auto mb-4 h-16 w-16 text-green-500" />
                            <h2 className="mb-4 text-xl font-bold text-navy-700 dark:text-white">
                                🎉 Session Completed!
                            </h2>
                        </div>

                        <div className="mx-auto max-w-md rounded-lg bg-gray-50 p-6 dark:bg-navy-700">
                            <h3 className="mb-4 text-center text-lg font-bold">📋 Session Bill</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span><strong>User:</strong></span>
                                    <span>{currentSession.user_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span><strong>Table:</strong></span>
                                    <span>{currentSession.table_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span><strong>Start Time:</strong></span>
                                    <span>{new Date(currentSession.start_time).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span><strong>End Time:</strong></span>
                                    <span>{new Date(currentSession.end_time).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span><strong>Duration:</strong></span>
                                    <span>{currentSession.duration_minutes} minutes</span>
                                </div>
                                <div className="flex justify-between">
                                    <span><strong>Rate:</strong></span>
                                    <span>₹{currentSession.rate_per_hour}/hour</span>
                                </div>
                                <hr className="my-3" />
                                <div className="flex justify-between text-lg font-bold text-brand-500">
                                    <span>Total Amount:</span>
                                    <span>₹{currentSession.total_charge}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <button
                                onClick={resetFlow}
                                className="rounded-lg bg-brand-500 px-8 py-3 text-white hover:bg-brand-600"
                            >
                                Start New Test Session
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Instructions */}
            <Card extra="mt-8">
                <div className="p-6">
                    <h3 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
                        📋 User Flow Testing Guide
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <h4 className="mb-2 font-semibold text-brand-500">Real User Experience</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li>• User scans QR code on gaming table</li>
                                <li>• Automatically redirects to user details form</li>
                                <li>• Session starts with real-time tracking</li>
                                <li>• User can end session anytime via their device</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-2 font-semibold text-green-500">Testing Features</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li>• Test complete user journey without QR scanning</li>
                                <li>• Simulate real gaming session timing</li>
                                <li>• Verify charge calculations are accurate</li>
                                <li>• Ensure data is saved correctly to backend</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default UserInterface;
