import React, { useState, useEffect } from 'react';
import {
  LogOut, Filter, Plus, User, Calendar, UserCheck,
  ArrowRight, Clock, FileText, ArrowLeft,
  TrashIcon,
  Trash,
  Trash2Icon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../lib/axios';
import Select from '../ui/Select';
// Make sure you remove this line: import { deleteTicket } from '../../../../backend/src/controllers/ticket.controller';
// This import is for a backend function, not for frontend use.

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
  const [deletingId, setDeletingId] = useState(null); // Added for delete button loading state

  const statusOptions = [
    { value: "All Status", label: "All Status" },
    { value: "Open", label: "Open" },
    { value: "In Progress", label: "In Progress" },
    { value: "Closed", label: "Closed" },
    { value: "Resolved", label: "Resolved" }, // Added Resolved
    { value: "On Hold", label: "On Hold" },   // Added On Hold
  ];

  useEffect(() => {
    const fetchTickets = async () => {
      setLoadingTickets(true);
      try {
        let endpoint = '/tickets';
        // Apply role-based filtering for tickets fetched for the list
        if (user?.role === 'customer') {
          endpoint = `/tickets?createdBy=${user.username}`;
        } else if (user?.role === 'support') {
          // Supports typically see all tickets relevant to them (assigned/unassigned)
          // For a general list, 'all' might be suitable. Adjust as needed.
          // If you want support to only see what they own: `endpoint = `/tickets?assignedTo=${user.username}`;`
          // If you want support to see all open/in-progress regardless of assignment:
          // You'd need a backend endpoint that combines assigned and unassigned open/in-progress tickets for support.
          // For now, assuming they see all tickets to populate the list for "Tickets requested by" on dashboard.
          // For this specific list, if they should only see what's relevant to them:
          // Consider fetching all and then filtering on the frontend for specific views,
          // or have backend endpoints like /tickets/support-view.
        }

        const response = await axiosInstance.get(endpoint);
        setTickets(response.data);
        setFilteredTickets(response.data);
        if (response.data.length > 0) {
          // If a ticket was previously selected (e.g., after deletion or filter change)
          // try to keep it selected if it still exists in the new list, otherwise select first.
          const currentSelected = response.data.find(t => t._id === selectedTicket?._id);
          setSelectedTicket(currentSelected || response.data[0]);
        } else {
          setSelectedTicket(null); // No tickets available
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
    // Only fetch if user object is available
    if (user) {
      fetchTickets();
    }
  }, [user, setAuthUser]); // Depend on user and setAuthUser

  useEffect(() => {
    if (status === 'All Status') {
      setFilteredTickets(tickets);
    } else {
      setFilteredTickets(tickets.filter(t => t.status === status));
    }
    // After filtering, if the selected ticket is no longer in the filtered list, deselect it
    if (selectedTicket && !filteredTickets.find(t => t._id === selectedTicket._id)) {
      setSelectedTicket(null);
    }
    // If no ticket is selected, and there are filtered tickets, select the first one
    if (!selectedTicket && filteredTickets.length > 0) {
      setSelectedTicket(filteredTickets[0]);
    }

  }, [status, tickets, selectedTicket]); // Add selectedTicket to dependencies

  useEffect(() => {
    const fetchSupportUsers = async () => {
      // Admins and Support agents need to see support users
      if (user?.role === 'admin' || user?.role === 'support') {
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

      // Update state for all tickets
      setTickets(prev =>
        prev.map(t => (t._id === updated._id ? updated : t))
      );
      // Update selected ticket
      setSelectedTicket(updated);
      toast.success(`Ticket ${updated._id.slice(-4)} assigned to ${assignedTo || 'nobody'}`);
    } catch (err) {
      console.error("Error assigning ticket:", err);
      toast.error("Failed to assign ticket. Only admins can assign.");
    } finally {
      setAssigningLoading(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket) return;

    if (!window.confirm(`Are you sure you want to delete ticket #${selectedTicket._id.slice(-4)}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(selectedTicket._id); // Set loading state for delete button
    try {
      await axiosInstance.delete(`/tickets/${selectedTicket._id}`);
      toast.success("Ticket deleted successfully!");
      // Filter out the deleted ticket
      setTickets(prev => prev.filter(t => t._id !== selectedTicket._id));
      // Reset selected ticket if the deleted one was selected
      setSelectedTicket(null); // Will automatically select first available in useEffect
    } catch (err) {
      console.error('Error deleting ticket:', err);
      if (err.response && err.response.status === 403) {
        toast.error('Permission denied: Only administrators can delete tickets.');
      } else {
        toast.error('Failed to delete ticket. Please try again.');
      }
    } finally {
      setDeletingId(null); // Clear loading state
    }
  }


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
    Resolved: 'bg-green-100 text-green-800', // Added for sidebar
    Closed: 'bg-gray-100 text-gray-800',     // Added for sidebar
    'On Hold': 'bg-orange-100 text-orange-800', // Added for sidebar
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
        <div className={`bg-white p-4 md:p-6 rounded-lg shadow-md md:col-span-1 ${showMobileDetails ? 'hidden md:block' : ''}`}>
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

          {/* Ticket List with Scrollbar */}
          {loadingTickets ? (
            <p className="text-center text-gray-600">Loading...</p>
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : (
            // APPLY SCROLLBAR HERE
            <div className="space-y-3 pr-2" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
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
                {user?.role === 'admin' && ( // Only show delete button for admin
                  <div className="flex flex-col items-end">
                    <button
                      onClick={handleDeleteTicket}
                      className="mb-3 text-red-500 hover:text-red-700"
                      disabled={deletingId === selectedTicket._id}
                      title="Delete Ticket"
                    >
                      {deletingId === selectedTicket._id ? (
                        <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <Trash2Icon size={20} />
                      )}
                    </button>
                    {supportUsers.length > 0 && ( // Show assign select if support users are loaded
                      <Select
                        label="Assign Support"
                        value={selectedTicket.assignedTo || ''}
                        onChange={handleAssignTicket}
                        options={supportUsers}
                        disabled={assigningLoading}
                      />
                    )}
                  </div>
                )}
                {/* For support users, only show assign select if they are support and supportUsers loaded */}
                {user?.role === 'support' && supportUsers.length > 0 && (
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