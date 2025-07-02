import React, { useState, useEffect } from 'react';
import { LogOut, Filter, Headphones, User, Plus, Ticket, Calendar, UserCheck, ArrowRight, Clock, FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../lib/axios';
import Select from '../ui/Select';

const Tickets = ({ user, setAuthUser }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("All Status");
  const [showMobileDetails, setShowMobileDetails] = useState(false);

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

  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
    setShowMobileDetails(true);
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
        {/* Mobile Back Button - Only shown when details are visible */}
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

        {/* Main Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 p-4 md:p-6">
          
          {/* Sidebar - Hidden on mobile when details are shown */}
          <div className={`bg-white max-h-none md:max-h-[610px] p-4 md:p-6 rounded-lg shadow-md md:col-span-1 overflow-auto ${showMobileDetails ? 'hidden md:block' : 'block'}`}>
            <div className="flex flex-col sm:flex-row md:flex-col justify-between items-start sm:items-center md:items-start mb-4 gap-3">
              <h2 className="text-lg md:text-xl font-bold">My Tickets</h2>
              <button
                onClick={() => navigate('/new-ticket')}
                className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base w-full sm:w-auto justify-center"
              >
                <Plus size={16} className="md:w-[18px] md:h-[18px]" />
                <span>New Ticket</span>
              </button>
            </div>

            {/* Filter */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Filter size={16} className="md:w-[18px] md:h-[18px] text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700 md:hidden">Filter by Status</span>
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
                    className={`p-3 border rounded-lg cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all ${selectedTicket?._id === ticket._id ? 'border-blue-600 bg-blue-50' : ''}`}
                    onClick={() => handleTicketSelect(ticket)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-sm md:text-base flex-1 pr-2">{ticket.title}</h3>
                      <span className="text-xs md:text-sm text-gray-500 flex-shrink-0">#{ticket._id.slice(-4)}</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-2">{ticket.description}</p>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs inline-block px-2 py-0.5 rounded-full ${getSidebarStatusColor(ticket.status)}`}>
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

          {/* Details View - Full width on mobile when shown */}
          <div className={`bg-white p-4 md:p-6 rounded-lg shadow-md md:col-span-2 ${!showMobileDetails && !selectedTicket ? 'hidden md:block' : 'block'} ${showMobileDetails ? 'md:col-span-2' : ''}`}>
            {selectedTicket ? (
              <div className="space-y-4 md:space-y-6">
                {/* Header Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-3 leading-tight">
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
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed bg-gray-50 p-3 md:p-4 rounded-lg">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Metadata Grid - Responsive */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
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
                      <User className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created By</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{selectedTicket.createdBy}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg md:col-span-2">
                    <div className="flex-shrink-0">
                      <UserCheck className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Assigned To</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{selectedTicket.assignedTo}</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end border-t border-gray-200 pt-4">
                  <button
                    onClick={() => navigate(`/ticket/${selectedTicket._id}`)}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg text-sm md:text-base"
                  >
                    View Full Details
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-base md:text-lg">Select a ticket to view details</p>
                <p className="text-gray-400 text-sm mt-1">Choose a ticket from the list to see its information here</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <footer className='flex items-center justify-center bg-gray-100 pb-3 px-4'>
        <span className="text-center text-sm">
          Made with ❤️ By <span className='font-bold text-purple-700'>Imroz</span>
        </span>
      </footer>
    </div>
  );
};

export default Tickets;