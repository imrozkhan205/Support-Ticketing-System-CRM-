import React, { useState, useEffect } from 'react';
import { LogOut, Filter, Headphones, User, Plus, Ticket, Calendar, UserCheck, ArrowRight, Clock, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../lib/axios';
import Select from '../ui/Select';

const Dashboard = ({ user, setAuthUser }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("All Status");

  const statusOptions = [
    { value: "All Status", label: "All Status" },
    { value: "Open", label: "Open" },
    { value: "In Progress", label: "In Progress" },
    { value: "Closed", label: "Closed" },
  ];

  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoadingTickets(true);
      setError(null);
      try {
        const response = await axiosInstance.get('/tickets');
        const data = response.data;
        setTickets(data);
        setFilteredTickets(data);
      } catch (err) {
        setError("Failed to load tickets.");
        if (err.response?.status === 401) {
          toast.error("Unauthorized. Please log in again.");
          setAuthUser(null);
        }
      } finally {
        setLoadingTickets(false);
      }
    };
    fetchTickets();
  }, [setAuthUser]);

  useEffect(() => {
    if (status === 'All Status') {
      setFilteredTickets(tickets);
    } else {
      setFilteredTickets(tickets.filter(ticket => ticket.status === status));
    }
  }, [status, tickets]);

  const handleLogout = () => {
    localStorage.clear();
    delete axiosInstance.defaults.headers.common['Authorization'];
    setAuthUser(null);
    toast.success("Logged out successfully!");
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Open': 'bg-blue-100 text-blue-800 border-blue-200',
      'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Resolved': 'bg-green-100 text-green-800 border-green-200',
      'Closed': 'bg-gray-100 text-gray-800 border-gray-200',
      'On Hold': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    if (status === 'In Progress') return <Clock className="w-3 h-3" />;
    return null;
  };

  const getSidebarStatusColor = (status) => {
    return {
      Open: 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      Closed: 'bg-green-100 text-green-800'
    }[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="min-h-screen bg-gray-100">
        {/* Navbar */}
        <nav className="bg-white shadow-md p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Ticket size={24} className="text-blue-600 mt-1" />
            <span className="text-xl font-bold text-gray-800">Support Ticketing System</span>
          </div>
          <div className="flex items-center space-x-4 text-gray-700">
            <div className="flex items-center space-x-1 font-medium">
              <User size={18} />
              <span>{user.username} ({user.role})</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* Main Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
          {/* Sidebar */}
          <div className="bg-white max-h-[610px] p-6 rounded-lg shadow-md md:col-span-1 overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold pr-3">My Tickets</h2>
              <button
                onClick={() => navigate('/new-ticket')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} />
                <span>New Ticket</span>
              </button>
            </div>

            {/* Filter */}
            <div className="mb-4">
              <Filter size={18} className="inline-block text-gray-500 mr-2 mb-2" />
              <Select
                label="Filter by Status"
                value={status}
                onChange={setStatus}
                options={statusOptions}
              />
            </div>

            {/* Ticket List */}
            {loadingTickets ? (
              <p className="text-center text-gray-600">Loading...</p>
            ) : error ? (
              <p className="text-red-500 text-center">{error}</p>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map(ticket => (
                  <div
                    key={ticket._id}
                    className={`p-3 border rounded-lg cursor-pointer hover:border-blue-400 ${selectedTicket?._id === ticket._id ? 'border-blue-600' : ''}`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{ticket.title}</h3>
                      <span className="text-sm text-gray-500">#{ticket._id.slice(-4)}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">{ticket.description}</p>
                    <span className={`text-xs inline-block mt-1 px-2 py-0.5 rounded-full ${getSidebarStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Details View */}
          <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
            {selectedTicket ? (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                    {selectedTicket.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedTicket.status)}`}>
                      {getStatusIcon(selectedTicket.status)}
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <Calendar className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created On</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(selectedTicket.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created By</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedTicket.createdBy}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg md:col-span-2">
                    <div className="flex-shrink-0">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Assigned To</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedTicket.assignedTo}</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end border-t border-gray-200 pt-4">
                  <button
                    onClick={() => navigate(`/ticket/${selectedTicket._id}`)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    View Full Details
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">Select a ticket to view details</p>
                <p className="text-gray-400 text-sm mt-1">Choose a ticket from the list to see its information here</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className='flex items-center justify-center bg-gray-100 pb-3'>
        Made with ❤️ By <span className='font-bold text-purple-700 pl-1'>Imroz</span>
      </footer>
    </div>
  );
};

export default Dashboard;