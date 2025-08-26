import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdPhone, MdVerifiedUser, MdGames } from "react-icons/md";

const PlayerLogin = () => {
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    // Check if coming from table scan
    const returnTo = location.state?.returnTo;
    const tableId = location.state?.tableId;

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!phoneNumber || phoneNumber.length !== 10) {
            setError("Please enter a valid 10-digit phone number");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Simulate API call for sending OTP
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log(`📱 OTP sent to ${phoneNumber}: 123456`);
            setStep(2);
        } catch (err) {
            setError("Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        if (otp !== "123456") {
            setError("Invalid OTP. Please try again.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Store player auth in localStorage
            const playerData = {
                phone: phoneNumber,
                loginTime: new Date().toISOString(),
                authenticated: true
            };

            localStorage.setItem('playerAuth', JSON.stringify(playerData));

            // Redirect based on context
            if (returnTo && tableId) {
                // Coming from table scan - go to dashboard with table info
                navigate('/player/dashboard', {
                    state: { tableId: tableId, autoStart: true }
                });
            } else {
                // Direct login - go to dashboard
                navigate('/player/dashboard');
            }
        } catch (err) {
            setError("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const formatPhoneNumber = (value) => {
        // Remove all non-digits
        const cleaned = value.replace(/\D/g, '');
        // Limit to 10 digits
        return cleaned.slice(0, 10);
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhoneNumber(formatted);
        setError("");
    };

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtp(value);
        setError("");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                        <MdGames className="text-white text-2xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Game Parlour</h1>
                    {tableId ? (
                        <div>
                            <p className="text-gray-600">Player Login Required</p>
                            <p className="text-sm text-blue-600 mt-1">Table {tableId} - Login to start gaming</p>
                        </div>
                    ) : (
                        <p className="text-gray-600">Player Portal</p>
                    )}
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {step === 1 ? (
                        // Step 1: Phone Number
                        <form onSubmit={handleSendOTP}>
                            <div className="text-center mb-6">
                                <MdPhone className="mx-auto text-4xl text-blue-500 mb-3" />
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Enter Phone Number</h2>
                                <p className="text-gray-600">We'll send you an OTP to verify your number</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={handlePhoneChange}
                                        placeholder="9876543210"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
                                        required
                                    />
                                </div>
                                {phoneNumber && phoneNumber.length === 10 && (
                                    <p className="mt-2 text-sm text-green-600">✓ Valid phone number</p>
                                )}
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || phoneNumber.length !== 10}
                                className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${loading || phoneNumber.length !== 10
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Sending OTP...
                                    </div>
                                ) : (
                                    'Send OTP'
                                )}
                            </button>
                        </form>
                    ) : (
                        // Step 2: OTP Verification
                        <form onSubmit={handleVerifyOTP}>
                            <div className="text-center mb-6">
                                <MdVerifiedUser className="mx-auto text-4xl text-green-500 mb-3" />
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify OTP</h2>
                                <p className="text-gray-600">
                                    Enter the 6-digit OTP sent to +91 {phoneNumber}
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    OTP Code
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={handleOtpChange}
                                    placeholder="123456"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-center text-2xl font-mono tracking-wider"
                                    maxLength={6}
                                    required
                                />
                                <div className="mt-2 text-center">
                                    <p className="text-xs text-gray-500">Demo OTP: 123456</p>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${loading || otp.length !== 6
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-500 hover:bg-green-600'
                                        }`}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Verifying...
                                        </div>
                                    ) : (
                                        'Verify & Login'
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full py-2 text-blue-500 hover:text-blue-600 font-medium"
                                >
                                    ← Change Phone Number
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Footer */}
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <p className="text-xs text-gray-500">
                            By logging in, you agree to our Terms of Service and Privacy Policy
                        </p>
                    </div>
                </div>

                {/* Demo Info */}
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="text-center">
                        <p className="text-sm font-medium text-amber-800 mb-1">🧪 Demo Mode</p>
                        <p className="text-xs text-amber-700">
                            Use any 10-digit phone number and OTP: <strong>123456</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerLogin;
