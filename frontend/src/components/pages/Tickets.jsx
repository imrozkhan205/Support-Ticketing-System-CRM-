import React, { useState, useEffect } from 'react';
import {
  LogOut, Filter, Plus, User, Calendar, UserCheck,
  ArrowRight, Clock, FileText, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../lib/axios';
import Select from '../ui/Select';

const Tickets = ({ user, setAuthUser }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("All Status");
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [supportUsers, setSupportUsers] = useState([]);
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [error, setError] = useState(null);

  const statusOptions = [
    { value: "All Status", label: "All Status" },
    { value: "Open", label: "Open" },
    { value: "In Progress", label: "In Progress" },
    { value: "Closed", label: "Closed" },
  ];

  useEffect(() => {
    const fetchTickets = async () => {
      setLoadingTickets(true);
      try {
        const response = await axiosInstance.get('/tickets');
        setTickets(response.data);
        setFilteredTickets(response.data);
        if (response.data.length > 0) {
          setSelectedTicket(response.data[0]);
        }
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
      setFilteredTickets(tickets.filter(t => t.status === status));
    }
  }, [status, tickets]);

  useEffect(() => {
    const fetchSupportUsers = async () => {
      if (user?.role === 'admin') {
        try {
          const res = await axiosInstance.get('/users?role=support');
          const formatted = res.data.map(u => ({ value: u.username, label: u.username }));
          setSupportUsers([{ value: '', label: 'Unassigned' }, ...formatted]);
        } catch (err) {
          toast.error("Failed to load support users.");
        }
      }
    };
    fetchSupportUsers();
  }, [user]);

  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
    setShowMobileDetails(true);
  };

  const handleAssignTicket = async (assignedTo) => {
    if (!selectedTicket || selectedTicket.assignedTo === assignedTo) return;

    setAssigningLoading(true);
    try {
      const res = await axiosInstance.put(`/tickets/${selectedTicket._id}/assign`, {
        assignedTo: assignedTo === '' ? null : assignedTo
      });
      const updated = res.data;

      // Update state
      setTickets(prev =>
        prev.map(t => (t._id === updated._id ? updated : t))
      );
      setSelectedTicket(updated);
      toast.success(`Assigned to ${assignedTo || 'nobody'}`);
    } catch (err) {
      toast.error("Failed to assign ticket.");
    } finally {
      setAssigningLoading(false);
    }
  };

  const getStatusColor = (status) => ({
    Open: 'bg-blue-100 text-blue-800 border-blue-200',
    'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Resolved: 'bg-green-100 text-green-800 border-green-200',
    Closed: 'bg-gray-100 text-gray-800 border-gray-200',
    'On Hold': 'bg-orange-100 text-orange-800 border-orange-200',
  }[status] || 'bg-gray-100 text-gray-800 border-gray-200');

  const getStatusIcon = (status) => {
    if (status === 'In Progress') return <Clock className="w-3 h-3" />;
    return null;
  };

  const getSidebarStatusColor = (status) => ({
    Open: 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    Closed: 'bg-green-100 text-green-800',
  }[status] || 'bg-gray-100 text-gray-800');

  return (
    <div className="min-h-screen bg-gray-100">
      {showMobileDetails && (
        <div className="md:hidden bg-white p-4 border-b border-gray-200 sticky top-0 z-10">
          <button
            onClick={() => setShowMobileDetails(false)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tickets
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 md:p-6">
        {/* Sidebar */}
        <div className={`bg-white p-4 md:p-6 rounded-lg shadow-md md:col-span-1 overflow-auto ${showMobileDetails ? 'hidden md:block' : ''}`}>
          <div className="flex flex-col sm:flex-row md:flex-col justify-between items-start sm:items-center md:items-start mb-4 gap-3">
            <h2 className="text-lg md:text-xl font-bold">My Tickets</h2>
            <button
              onClick={() => navigate('/new-ticket')}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
            >
              <Plus size={16} />
              <span>New Ticket</span>
            </button>
          </div>

          {/* Filter */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Filter size={16} className="text-gray-500 mr-2" />
              <span className="text-sm text-gray-700 md:hidden">Filter by Status</span>
            </div>
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
                  className={`p-3 border rounded-lg cursor-pointer hover:border-blue-400 transition-all ${selectedTicket?._id === ticket._id ? 'border-blue-600 bg-blue-50' : ''}`}
                  onClick={() => handleTicketSelect(ticket)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm">{ticket.title}</h3>
                    <span className="text-xs text-gray-500">#{ticket._id.slice(-4)}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">{ticket.description}</p>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getSidebarStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 md:hidden" />
                  </div>
                </div>
              ))}
              {filteredTickets.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No tickets found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ticket Details */}
        <div className={`bg-white p-4 md:p-6 rounded-lg shadow-md md:col-span-2 ${!showMobileDetails && !selectedTicket ? 'hidden md:block' : ''}`}>
          {selectedTicket ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <h2 className="text-lg md:text-2xl font-bold">{selectedTicket.title}</h2>
                {user?.role === 'admin' && supportUsers.length > 0 && (
                  <div className="w-48 relative">
                    <Select
                      label="Assign Support"
                      value={selectedTicket.assignedTo || ''}
                      onChange={handleAssignTicket}
                      options={supportUsers}
                      disabled={assigningLoading}
                    />
                    {assigningLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 rounded-lg">
                        <p className="text-blue-600 text-sm">Assigning...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedTicket.description}</p>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Created On</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Created By</p>
                    <p className="text-sm font-semibold">{selectedTicket.createdBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg md:col-span-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 uppercase">Assigned To</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedTicket.assignedTo || 'Unassigned'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/ticket/${selectedTicket._id}`)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm"
                >
                  View Full Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>

      <footer className="flex justify-center bg-gray-100 pb-4 text-sm">
        Made with ❤️ By <span className="font-bold text-purple-700 ml-1">Imroz</span>
      </footer>
    </div>
  );
};

export default Tickets;
