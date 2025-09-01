import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdBusiness, MdPerson, MdEmail, MdPhone, MdLocationOn, MdDescription } from "react-icons/md";
import axios from "axios";
import { buildApiUrl, API_ENDPOINTS } from "../../config/api";
import Toast from "components/notifications/Toast";

const GameParlourSignup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [signupComplete, setSignupComplete] = useState(false);
    const [signupResult, setSignupResult] = useState(null);

    const [formData, setFormData] = useState({
        // Business Information
        business_name: "",
        description: "",
        address: "",
        contact_email: "",
        contact_phone: "",

        // Owner Information
        owner_name: "",
        owner_email: "",
        owner_phone: "",
        owner_password: "",
        confirm_password: "",

        // Business Details
        expected_tables: 5,
        business_type: "gaming_parlour",

        // Terms and Marketing
        agreed_to_terms: false,
        marketing_consent: false
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const validateForm = () => {
        if (!formData.business_name.trim()) {
            setMessage("Business name is required");
            setMessageType("error");
            return false;
        }

        if (!formData.address.trim()) {
            setMessage("Business address is required");
            setMessageType("error");
            return false;
        }

        if (!formData.contact_email.trim()) {
            setMessage("Contact email is required");
            setMessageType("error");
            return false;
        }

        if (!formData.owner_name.trim()) {
            setMessage("Owner name is required");
            setMessageType("error");
            return false;
        }

        if (!formData.owner_email.trim()) {
            setMessage("Owner email is required");
            setMessageType("error");
            return false;
        }

        if (!formData.owner_password || formData.owner_password.length < 6) {
            setMessage("Password must be at least 6 characters long");
            setMessageType("error");
            return false;
        }

        if (formData.owner_password !== formData.confirm_password) {
            setMessage("Passwords do not match");
            setMessageType("error");
            return false;
        }

        if (!formData.agreed_to_terms) {
            setMessage("You must agree to the terms and conditions");
            setMessageType("error");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!validateForm()) {
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        setLoading(true);

        try {
            const signupData = {
                business_name: formData.business_name,
                description: formData.description || null,
                address: formData.address,
                contact_email: formData.contact_email,
                contact_phone: formData.contact_phone || null,
                owner_name: formData.owner_name,
                owner_email: formData.owner_email,
                owner_phone: formData.owner_phone || null,
                owner_password: formData.owner_password,
                expected_tables: parseInt(formData.expected_tables),
                business_type: formData.business_type,
                agreed_to_terms: formData.agreed_to_terms,
                marketing_consent: formData.marketing_consent
            };

            const response = await axios.post(buildApiUrl(API_ENDPOINTS.GAME_PARLOUR_SIGNUP), signupData);

            setSignupResult(response.data);
            setSignupComplete(true);
            setMessage("Signup successful! Your application is pending approval.");
            setMessageType("success");

        } catch (error) {
            console.error("Signup error:", error);
            setMessage(error.response?.data?.detail || "Signup failed. Please try again.");
            setMessageType("error");
            setTimeout(() => setMessage(""), 5000);
        } finally {
            setLoading(false);
        }
    };

    if (signupComplete && signupResult) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">🎉 Signup Successful!</h2>
                        <p className="text-lg text-gray-600">Your game parlour application has been submitted</p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Application Details</h3>
                        <div className="space-y-2 text-sm text-blue-800">
                            <div><strong>Business:</strong> {formData.business_name}</div>
                            <div><strong>Owner:</strong> {formData.owner_name}</div>
                            <div><strong>Username:</strong> {signupResult.owner_username}</div>
                            <div><strong>Status:</strong> <span className="text-yellow-600">⏳ Pending Approval</span></div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">📝 Next Steps</h3>
                        <ul className="space-y-2">
                            {signupResult.next_steps.map((step, index) => (
                                <li key={index} className="text-sm text-gray-700 flex items-start">
                                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={() => navigate("/auth/sign-in")}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            🔑 Go to Login
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            🏠 Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        🎮 Join Our Game Parlour Network
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Start managing your gaming business with our powerful SaaS platform.
                        Free plan includes 5 tables and 2 staff members!
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600">
                        <h2 className="text-2xl font-bold text-white">Get Started Today</h2>
                        <p className="text-blue-100 mt-2">Fill out the form below to apply for your game parlour account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
                        {message && (
                            <div className={`rounded-xl p-4 ${messageType === "success"
                                    ? "bg-green-50 border border-green-200"
                                    : "bg-red-50 border border-red-200"
                                }`}>
                                <p className={`text-sm ${messageType === "success" ? "text-green-600" : "text-red-600"
                                    }`}>
                                    {message}
                                </p>
                            </div>
                        )}

                        {/* Business Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    🏢 Business Information
                                </h3>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Name *
                                </label>
                                <input
                                    type="text"
                                    name="business_name"
                                    value={formData.business_name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="GameZone Paradise"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Email *
                                </label>
                                <input
                                    type="email"
                                    name="contact_email"
                                    value={formData.contact_email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="info@gamezoneparadise.com"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Address *
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="123 Main Street, Gaming District, City, State"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Phone
                                </label>
                                <input
                                    type="tel"
                                    name="contact_phone"
                                    value={formData.contact_phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="+1-555-123-4567"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Expected Number of Tables
                                </label>
                                <select
                                    name="expected_tables"
                                    value={formData.expected_tables}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                >
                                    <option value="1">1-2 tables</option>
                                    <option value="5">3-5 tables (Free Plan)</option>
                                    <option value="15">6-15 tables (Premium Plan)</option>
                                    <option value="25">16-25 tables (Premium Plan)</option>
                                    <option value="50">25+ tables (Enterprise Plan)</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                                    placeholder="Tell us about your gaming business..."
                                />
                            </div>
                        </div>

                        {/* Owner Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                            <div className="md:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    👤 Owner Information
                                </h3>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Owner Name *
                                </label>
                                <input
                                    type="text"
                                    name="owner_name"
                                    value={formData.owner_name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="John Gaming"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Owner Email *
                                </label>
                                <input
                                    type="email"
                                    name="owner_email"
                                    value={formData.owner_email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="john@gamezoneparadise.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Owner Phone
                                </label>
                                <input
                                    type="tel"
                                    name="owner_phone"
                                    value={formData.owner_phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="+1-555-987-6543"
                                />
                            </div>

                            <div></div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    name="owner_password"
                                    value={formData.owner_password}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="Choose a secure password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password *
                                </label>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    value={formData.confirm_password}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="Confirm your password"
                                />
                            </div>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="pt-6 border-t border-gray-200">
                            <div className="space-y-4">
                                <label className="flex items-start">
                                    <input
                                        type="checkbox"
                                        name="agreed_to_terms"
                                        checked={formData.agreed_to_terms}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-3 text-sm text-gray-700">
                                        I agree to the <a href="#" className="text-blue-600 hover:underline">Terms and Conditions</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> *
                                    </span>
                                </label>

                                <label className="flex items-start">
                                    <input
                                        type="checkbox"
                                        name="marketing_consent"
                                        checked={formData.marketing_consent}
                                        onChange={handleInputChange}
                                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-3 text-sm text-gray-700">
                                        I would like to receive updates and marketing communications about new features
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-200 ${loading
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                                    }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </span>
                                ) : (
                                    "🚀 Create Game Parlour Account"
                                )}
                            </button>
                        </div>

                        <div className="text-center pt-4">
                            <p className="text-sm text-gray-600">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => navigate("/auth/sign-in")}
                                    className="text-blue-600 hover:underline font-medium"
                                >
                                    Sign in here
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GameParlourSignup;
