import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';

const DashboardLayout = ({ user, handleLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen">
      {sidebarOpen && <Sidebar role={user.role} />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          user={user}
          handleLogout={handleLogout}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
