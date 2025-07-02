// components/layout/ProtectedLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';

const ProtectedLayout = ({ user, handleLogout }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} handleLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
