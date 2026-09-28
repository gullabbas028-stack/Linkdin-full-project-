import React, { useState, useContext } from "react";
import logo from "../assets/logo.svg";
import { useNavigate } from "react-router-dom";
import { authContext } from "../context/AuthContext.jsx";
import { userDatacontext } from "../context/UserContext.jsx";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { serverUrl } = useContext(authContext);
  const { getCurrentUser } = useContext(userDatacontext);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/login`,
        {
          email,
          password,
        },
        {
          withCredentials: true,
        }
      );

      console.log("Login successful:", result.data);

      // Get current logged-in user
      await getCurrentUser();

      // Clear inputs
      setEmail("");
      setPassword("");

      // Go to Home
      navigate("/");
    } catch (error) {
      console.log("Login Error:", error.response?.data);

      setError(
        error.response?.data?.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center justify-start">

      {/* Logo */}
      <div className="px-8 pt-6 w-full h-[80px] flex items-center">
        <img
          src={logo}
          alt="LinkedIn Logo"
          className="w-24 h-auto"
        />
      </div>

      {/* Login Form */}
      <form
        className="w-[90%] max-w-[400px] bg-white shadow-lg rounded-lg p-6 mt-8"
        onSubmit={handleLogin}
      >
        {/* Heading */}
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Sign In
        </h1>

        <p className="text-sm text-gray-600 mb-6">
          Sign in to your account
        </p>

        {/* Email */}
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-3 border border-gray-400 rounded-md outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
          />
        </div>

        {/* Password */}
        <div className="mb-5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-3 pr-12 border border-gray-400 rounded-md outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
            />

            {password.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0A66C2] transition"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  // Eye Off
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                    <path d="M9.88 4.24A9.77 9.77 0 0 1 12 4c5 0 9.27 3.11 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M6.61 6.61C4.62 7.92 3.17 9.75 2 12c1.73 4.89 6 8 10 8a9.77 9.77 0 0 0 2.12-.23" />
                  </svg>
                ) : (
                  // Eye
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm text-center mb-3">
            {error}
          </p>
        )}

        {/* Terms */}
        <p className="text-xs text-gray-600 text-center mb-5">
          By clicking Sign In, you agree to our{" "}
          <span className="text-[#0A66C2] font-medium cursor-pointer hover:underline">
            User Agreement
          </span>
          ,{" "}
          <span className="text-[#0A66C2] font-medium cursor-pointer hover:underline">
            Privacy Policy
          </span>{" "}
          and{" "}
          <span className="text-[#0A38CE] font-medium cursor-pointer hover:underline">
            Cookie Policy
          </span>
          .
        </p>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] disabled:bg-gray-400 text-white font-semibold rounded-full transition duration-200"
        >
          {loading ? "Loading..." : "Sign In"}
        </button>

        {/* Sign Up */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{" "}
          <span
            className="text-[#0A66C2] font-semibold cursor-pointer hover:underline transition duration-200"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;