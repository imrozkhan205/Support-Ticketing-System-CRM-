// Dashboard.jsx
import React from 'react';
import { LogOut } from 'lucide-react'; // Import the LogOut icon
import { toast } from 'react-hot-toast'; // For toast notifications

const Dashboard = ({ user, setAuthUser }) => {
  const handleLogout = () => {
    // Clear authentication data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    // Clear the authenticated user state in App.jsx
    setAuthUser(null);

    // Show a toast message
    toast.success("Logged out successfully!");
  };

  return (
    <div className='min-h-screen bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 relative p-4'>
      {/* Logout Button positioned at the top-right */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition duration-200 flex items-center space-x-2"
      >
        <LogOut size={20} /> {/* Lucide LogOut Icon */}
        <span>Logout</span>
      </button>

      {/* Main Dashboard content, pushed down to avoid overlapping the button */}
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Your Dashboard, {user.username}!</h1>
          <p className="text-lg text-gray-600 mb-8">
            You are logged in as a <span className="font-semibold text-blue-600">{user.role}</span>.
          </p>
          {/* Add more of your dashboard-specific content here */}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;