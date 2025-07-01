import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosInstance } from '../../lib/axios';

const LoginPage = ({ setAuthUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!username || !password) {
      toast.error("Please enter both username and password.");
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post('/auth/login', { username, password });
      const { token, username: user, role } = response.data;

      // Store token and user info
      localStorage.setItem("token", token);
      localStorage.setItem("username", user);
      localStorage.setItem("role", role);

      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setAuthUser({ username: user, role });
      toast.success("Login successful!");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Login</h2>

        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label htmlFor="username" className="block text-gray-700 text-sm font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center justify-center"
            disabled={loading}
          >
            {loading && (
              <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
