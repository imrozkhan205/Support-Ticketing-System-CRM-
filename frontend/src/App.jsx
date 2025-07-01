// App.jsx
import { Route, Routes, Navigate } from 'react-router-dom'
import { Toaster } from "react-hot-toast"
import { useState, useEffect } from 'react'

import LoginPage from './components/pages/LoginPage.jsx'
import TicketDetail from './components/pages/TicketDetail.jsx'
import NewTicket from './components/pages/NewTicket.jsx'
import Dashboard from './components/pages/Dashboard.jsx'
import { axiosInstance } from './lib/axios.js'


function App() {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div className='h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex items-center justify-center'>
        <div className="h-10 w-10 border-4 border-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className='h-screen bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 h-screen'>
      <Routes>
        {/* Pass setAuthUser to Dashboard */}
        <Route path='/' element={authUser ? <Dashboard user={authUser} setAuthUser={setAuthUser} /> : <Navigate to="/login" replace />} />
        <Route path='/login' element={!authUser ? <LoginPage setAuthUser={setAuthUser} /> : <Navigate to="/" replace />} />
        <Route path='/ticket/:id' element={authUser ? <TicketDetail user={authUser} /> : <Navigate to="/login" replace />} />
        <Route path='/new-ticket' element={authUser ? <NewTicket user={authUser} /> : <Navigate to="/login" replace />} />
        <Route path='*' element={<Navigate to={authUser ? "/" : "/login"} replace />} />
      </Routes>
      <Toaster />
    </div>
  )
}

export default App