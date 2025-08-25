import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "components/fields/InputField";
import { FcGoogle } from "react-icons/fc";
import Checkbox from "components/checkbox";
import authService from "../../services/authService";

export default function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use auth service for login
      await authService.login({
        username: formData.username,
        password: formData.password,
      });

      // Redirect to admin dashboard
      navigate("/admin");
    } catch (error) {
      setError(error.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="mt-16 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      {/* Sign in section */}
      <div className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        <h4 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">
          🎮 Game Parlour Admin
        </h4>
        <p className="mb-9 ml-1 text-base text-gray-600">
          Enter your username and password to access the admin panel
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <InputField
            variant="auth"
            extra="mb-3"
            label="Username*"
            placeholder="Enter your username"
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleInputChange}
            required
          />

          {/* Password */}
          <InputField
            variant="auth"
            extra="mb-3"
            label="Password*"
            placeholder="Enter your password"
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          
          {/* Checkbox */}
          <div className="mb-4 flex items-center justify-between px-2">
            <div className="flex items-center">
              <Checkbox 
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
              />
              <p className="ml-2 text-sm font-medium text-navy-700 dark:text-white">
                Keep me logged In
              </p>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className={`linear mt-2 w-full rounded-xl py-[12px] text-base font-medium text-white transition duration-200 ${
              loading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:bg-brand-200"
            }`}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h5 className="text-sm font-semibold text-blue-800 mb-2">Demo Credentials:</h5>
          <p className="text-xs text-blue-600">
            <strong>Username:</strong> admin<br/>
            <strong>Password:</strong> admin123
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Admin access only • Game Parlour Management System
          </p>
        </div>
      </div>
    </div>
  );
}
