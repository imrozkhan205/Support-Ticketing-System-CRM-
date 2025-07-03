import React, { useEffect, useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { 
  Ticket, 
  User, // For the current user icon (customer dashboard or general user icon)
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Users, // For support agents chart (admin only)
  FileText
} from 'lucide-react';
import { axiosInstance } from '../../lib/axios'; // Import your axiosInstance

// Make sure to accept the 'user' prop
const Dashboard = ({ user }) => { 
  const [tickets, setTickets] = useState([]);
  const [supports, setSupports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch tickets data based on user role
        let ticketsEndpoint = '/tickets';
        if (user.role === 'customer') {
          ticketsEndpoint = `/tickets?createdBy=${user.username}`; 
        } else if (user.role === 'support') {
          // Support agent sees all tickets (or at least all open/in-progress)
          // Adjust this endpoint based on what a support agent *should* see.
          // For simplicity, fetching all for support agent to calculate all requester data.
          // If a support agent should only see tickets assigned to them AND unassigned,
          // you'd need a more complex endpoint or multiple fetches.
          // For "Tickets Requested By" to be useful for support, they need access to all tickets.
          ticketsEndpoint = '/tickets'; 
        }
        
        const ticketsResponse = await axiosInstance.get(ticketsEndpoint);
        setTickets(ticketsResponse.data);

        // Fetch supports data only if the user is an admin (to calculate agent stats)
        // Or if support agent needs to resolve assignedTo usernames to display names
        if (user.role === 'admin' || user.role === 'support') { // Support agents also need support data for `assignedTo` name resolution
          const supportsResponse = await axiosInstance.get('/users?role=support');
          setSupports(supportsResponse.data); 
        }
        
      } catch (err) {
        setError('Failed to fetch dashboard data. Please try again later.');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data if user object is available
    if (user) { 
      fetchData();
    }
  }, [user]); // Re-run effect if the user object changes (e.g., after login/logout)

  // Calculate dashboard metrics
  const getDashboardData = () => {
    const statusMap = {
      'Open': 0,
      'In Progress': 0,
      'Resolved': 0, 
      'Closed': 0,
      'On Hold': 0, 
    };

    const supportCount = {};
    const createdByCount = {}; 
    const dailyTickets = {};
    let unassignedTicketsCount = 0; 

    tickets.forEach(ticket => {
      // Status count
      if (statusMap[ticket.status] !== undefined) {
        statusMap[ticket.status]++;
      }

      // Calculate unassigned tickets (only for admin/support)
      if (user.role !== 'customer' && !ticket.assignedTo) {
        unassignedTicketsCount++;
      }

      // Support assignment count (only for admin)
      if (user.role === 'admin' && ticket.assignedTo) {
        const supportDisplayName = supports.find(s => s.username === ticket.assignedTo)?.username || ticket.assignedTo;
        supportCount[supportDisplayName] = (supportCount[supportDisplayName] || 0) + 1;
      }

      // CreatedBy user count (for admin and support)
      if ((user.role === 'admin' || user.role === 'support') && ticket.createdBy) {
        createdByCount[ticket.createdBy] = (createdByCount[ticket.createdBy] || 0) + 1;
      }

      // Daily tickets for trend (applicable to all, but data will be role-filtered)
      const date = new Date(ticket.createdAt).toISOString().split('T')[0];
      dailyTickets[date] = (dailyTickets[date] || 0) + 1;
    });

    const statusData = Object.entries(statusMap)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    const supportData = Object.entries(supportCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const createdByData = Object.entries(createdByCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const trendData = Object.entries(dailyTickets)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, count]) => ({ 
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
        tickets: count 
      }));

    return {
      statusData,
      supportData,
      createdByData,
      trendData,
      totalTickets: tickets.length,
      openTickets: statusMap['Open'] || 0,
      inProgressTickets: statusMap['In Progress'] || 0,
      closedTickets: statusMap['Closed'] || 0,
      unassignedTickets: unassignedTicketsCount
    };
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']; 

  if (!user || loading) { 
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const dashboardData = getDashboardData();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your ticket management system</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalTickets}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardData.openTickets}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{dashboardData.inProgressTickets}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Unassigned Tickets Card - Visible only for Admin and Support */}
          {(user.role === 'admin' || user.role === 'support') ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unassigned</p>
                  <p className="text-2xl font-bold text-red-600">{dashboardData.unassignedTickets}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          ) : ( /* For customers, show Closed Tickets instead */
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Closed Tickets</p>
                    <p className="text-2xl font-bold text-green-600">{dashboardData.closedTickets}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Ticket Status Pie Chart - Visible to all, but data will be relevant to their access */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Ticket className="h-5 w-5 mr-2" />
              Ticket Status Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {dashboardData.statusData.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Conditional second chart based on role */}
          {user.role === 'admin' && ( // Only Admin sees "Tickets by Support Agent"
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Tickets by Support Agent
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.supportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {(user.role === 'support') && ( // Support or Customer sees "Tickets by Requester" or a placeholder
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" /> 
                Tickets Requested By
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                 {/* Customers will only see their own name on this chart if data is filtered by createdBy */}
                <BarChart data={dashboardData.createdByData}> 
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tickets by Requester Chart - Only for Admin */}
          {user.role === 'admin' && ( // Keep this here for Admin as their 3rd chart
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" /> 
                Tickets by Requester
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.createdByData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* For support, if you want them to have a different third chart or just nothing */}
          {/* {user.role === 'support' && (
              <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <TrendingUp className="h-10 w-10 mx-auto mb-3" />
                  <p>Agent specific insights coming soon!</p>
                </div>
              </div>
          )} */}


          {/* Ticket Creation Trend - Visible to all, data will be relevant to their access */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Ticket Creation Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="tickets" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Made with ❤️ by <span className="font-bold text-purple-700">Imroz</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;