import React from 'react';
import { LogOut, Ticket, User, LayoutDashboard, Sidebar } from 'lucide-react';

const Navbar = ({ user, handleLogout, toggleSidebar }) => {
  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      {/* Left - Toggle Sidebar Icon + Logo */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="text-gray-700 hover:text-blue-600 transform transition-transform duration-400 active:scale-95"
        >
          <Sidebar size={24} />
        </button>
        <div className="flex items-center">
          <span className="text-xl font-bold text-gray-800">Support Ticketing System</span>
        </div>
      </div>

      {/* Right - User Info & Logout */}
      {user && (
        <div className="flex items-center space-x-4 text-gray-700">
          <div className="flex items-center space-x-1 font-medium">
            <User size={18} />
            <span>{user.username} ({user.role})</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2 transition-colors duration-200"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
