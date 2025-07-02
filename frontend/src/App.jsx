import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import toast, { Toaster } from "react-hot-toast";
import { useState, useEffect } from 'react';

import LoginPage from './components/pages/LoginPage.jsx';
import TicketDetail from './components/pages/TicketDetail.jsx';
import NewTicket from './components/pages/NewTicket.jsx';
import Dashboard from './components/pages/Dashboard.jsx';
import Tickets from './components/pages/Tickets.jsx';
import Support from './components/pages/Support.jsx';
import Customer from './components/pages/Customer.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';

import { axiosInstance } from './lib/axios.js';

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    delete axiosInstance.defaults.headers.common['Authorization'];
    setAuthUser(null);
    toast.success("Logged out successfully!");
    navigate('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const username = localStorage.getItem("username");
      const role = localStorage.getItem("role");
      setAuthUser({ username, role });
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className='h-screen bg-slate-900 text-white flex items-center justify-center'>
        <div className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <Routes>
        {/* Login Route */}
        <Route
          path='/login'
          element={!authUser ? <LoginPage setAuthUser={setAuthUser} /> : <Navigate to="/dashboard" replace />}
        />

        {/* Protected Routes */}
        {authUser && (
          <Route element={<DashboardLayout user={authUser} handleLogout={handleLogout} />}>
            <Route path='/' element={<Navigate to='/dashboard' replace />} />
            <Route path='dashboard' element={<Dashboard user={authUser} setAuthUser={setAuthUser} />} />
            <Route path='tickets' element={<Tickets user={authUser} setAuthUser={setAuthUser} />} />
            <Route path='supports' element={<Support />} />
            <Route path='customers' element={<Customer />} />
            <Route path='ticket/:id' element={<TicketDetail user={authUser} />} />
            <Route path='new-ticket' element={<NewTicket user={authUser} />} />
            <Route path='*' element={<Navigate to="/dashboard" replace />} />
          </Route>
        )}

        {/* Catch All - If not logged in */}
        {!authUser && <Route path='*' element={<Navigate to="/login" replace />} />}
      </Routes>
    </>
  );
}

export default App;
