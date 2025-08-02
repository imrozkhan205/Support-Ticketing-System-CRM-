import React, { useState, useEffect, useRef } from "react";
import {
  LogOut,
  Filter,
  Plus,
  User,
  Calendar,
  UserCheck,
  ArrowRight,
  Clock,
  FileText,
  ArrowLeft,
  TrashIcon,
  MessageSquare, // Keep MessageSquare icon for the button
  Trash2Icon,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../lib/axios";
import Select from "../ui/Select";

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
  const [deletingId, setDeletingId] = useState(null);

  // REMOVED: newMessage, sendingMessage, showChat states

  // REMOVED: lastMessageRef

  const statusOptions = [
    { value: "All Status", label: "All Status" },
    { value: "Open", label: "Open" },
    { value: "In Progress", label: "In Progress" },
    { value: "Closed", label: "Closed" },
    { value: "Resolved", label: "Resolved" },
    { value: "On Hold", label: "On Hold" },
  ];

  useEffect(() => {
    const fetchTickets = async () => {
      setLoadingTickets(true);
      try {
        let endpoint = "/tickets";
        if (user?.role === "customer") {
          endpoint = `/tickets?createdBy=${user.username}`;
        } else if (user?.role === "support") {
          // Add support-specific filtering if needed
        }

        const response = await axiosInstance.get(endpoint);
        setTickets(response.data);
        setFilteredTickets(response.data);
        if (response.data.length > 0) {
          const currentSelected = response.data.find(
            (t) => t._id === selectedTicket?._id
          );
          setSelectedTicket(currentSelected || response.data[0]);
        } else {
          setSelectedTicket(null);
        }
      } catch (err) {
        setError("Failed to load tickets.");
        if (err.response?.status === 401) {
          toast.error("Unauthorized. Please log in again.");
          setAuthUser(null);
          navigate("/login");
        } else {
          toast.error("An error occurred while fetching tickets.");
        }
      } finally {
        setLoadingTickets(false);
      }
    };

    if (user) {
      fetchTickets();
    }
  }, [user, setAuthUser, navigate]);

  useEffect(() => {
    let currentFiltered = [];
    if (status === "All Status") {
      currentFiltered = tickets;
    } else {
      currentFiltered = tickets.filter((t) => t.status === status);
    }
    setFilteredTickets(currentFiltered);

    // When filters change, ensure selected ticket is still in filtered list
    if (!currentFiltered.find((t) => t._id === selectedTicket?._id)) {
      setSelectedTicket(currentFiltered.length > 0 ? currentFiltered[0] : null);
    } else if (!selectedTicket && currentFiltered.length > 0) {
      setSelectedTicket(currentFiltered[0]);
    }
  }, [status, tickets, selectedTicket]);

  useEffect(() => {
    const fetchSupportUsers = async () => {
      if (user?.role === "admin" || user?.role === "support") {
        try {
          const res = await axiosInstance.get("/users?role=support");
          const formatted = res.data.map((u) => ({
            value: u.username,
            label: u.username,
          }));
          setSupportUsers([{ value: "", label: "Unassigned" }, ...formatted]);
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
    // REMOVED: setShowChat(false);
  };

  const handleAssignTicket = async (assignedTo) => {
    if (!selectedTicket || selectedTicket.assignedTo === assignedTo) return;

    setAssigningLoading(true);
    try {
      const res = await axiosInstance.put(
        `/tickets/${selectedTicket._id}/assign`,
        {
          assignedTo: assignedTo === "" ? null : assignedTo,
        }
      );
      const updated = res.data;

      setTickets((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
      setSelectedTicket(updated);
      toast.success(
        `Ticket ${updated._id.slice(-4)} assigned to ${assignedTo || "nobody"}`
      );
    } catch (err) {
      console.error("Error assigning ticket:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to assign ticket.";
      toast.error(errorMessage);
    } finally {
      setAssigningLoading(false);
    }
  };

  // REMOVED: handleSendMessage function and its related states/refs

  const handleDeleteTicket = async () => {
    if (!selectedTicket) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ticket #${selectedTicket._id.slice(
          -4
        )}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(selectedTicket._id);
    try {
      await axiosInstance.delete(`/tickets/${selectedTicket._id}`);
      toast.success("Ticket deleted successfully!");
      setTickets((prev) => prev.filter((t) => t._id !== selectedTicket._id));
      setSelectedTicket(null);
      // REMOVED: setShowChat(false);
    } catch (err) {
      console.error("Error deleting ticket:", err);
      if (err.response && err.response.status === 403) {
        toast.error(
          "Permission denied: Only administrators can delete tickets."
        );
      } else {
        toast.error("Failed to delete ticket. Please try again.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status) =>
    ({
      Open: "bg-blue-100 text-blue-800 border-blue-200",
      "In Progress": "bg-yellow-100 text-yellow-800 border-yellow-200",
      Resolved: "bg-green-100 text-green-800 border-green-200",
      Closed: "bg-gray-100 text-gray-800 border-gray-200",
      "On Hold": "bg-orange-100 text-orange-800 border-orange-200",
    }[status] || "bg-gray-100 text-gray-800 border-gray-200");

  const getStatusIcon = (status) => {
    if (status === "In Progress") return <Tick className="w-3 h-3" />;
    return null;
  };

  const getSidebarStatusColor = (status) =>
    ({
      Open: "bg-blue-100 text-blue-800",
      "In Progress": "bg-yellow-100 text-yellow-800",
      Resolved: "bg-green-100 text-green-800",
      Closed: "bg-gray-100 text-gray-800",
      "On Hold": "bg-orange-100 text-orange-800",
    }[status] || "bg-gray-100 text-gray-800");

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
        <div
          className={`bg-white p-4 md:p-6 rounded-lg shadow-md md:col-span-1 ${
            showMobileDetails ? "hidden md:block" : ""
          }`}
        >
          <div className="flex flex-col sm:flex-row md:flex-col justify-between items-start sm:items-center md:items-start mb-4 gap-3">
            <h2 className="text-lg md:text-xl font-bold">My Tickets</h2>
            <button
              onClick={() => navigate("/new-ticket")}
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
              <span className="text-sm text-gray-700 md:hidden">
                Filter by Status
              </span>
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
            <div
              className="space-y-3 pr-2"
              style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}
            >
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className={`p-3 border rounded-lg cursor-pointer hover:border-blue-400 transition-all ${
                    selectedTicket?._id === ticket._id
                      ? "border-blue-600 bg-blue-50"
                      : ""
                  }`}
                  onClick={() => handleTicketSelect(ticket)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm">{ticket.title}</h3>
                    <span className="text-xs text-gray-500">
                      #{ticket._id.slice(-4)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {ticket.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getSidebarStatusColor(
                        ticket.status
                      )}`}
                    >
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
        <div
          className={`bg-white p-4 md:p-6 rounded-lg shadow-md md:col-span-2 ${
            !showMobileDetails && !selectedTicket ? "hidden md:block" : ""
          }`}
        >
          {selectedTicket ? (
            <div className="flex flex-col h-full space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <h2 className="text-lg md:text-2xl font-bold">
                  {selectedTicket.title}
                </h2>
                {user?.role === "admin" && (
                  <div className="flex flex-col items-end">
                    <button
                      onClick={handleDeleteTicket}
                      className="mb-3 text-red-500 hover:text-red-700"
                      disabled={deletingId === selectedTicket._id}
                      title="Delete Ticket"
                    >
                      {deletingId === selectedTicket._id ? (
                        <svg
                          className="animate-spin h-5 w-5 text-red-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <Trash2Icon size={20} />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Ticket Meta Info */}
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 border-b border-gray-200 pb-4">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  <span>
                    Created By:{" "}
                    <span className="font-semibold">
                      {selectedTicket.createdBy}
                    </span>
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span>
                    Created On:{" "}
                    <span className="font-semibold">
                      {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </span>
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span>
                    Status:{" "}
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-full ${getStatusColor(
                        selectedTicket.status
                      )}`}
                    >
                      {selectedTicket.status}
                    </span>
                  </span>
                </div>
                {(user?.role === "admin" || user?.role === "support") && (
                  <div className="flex items-center gap-5">
                    <UserCheck className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Assigned To: </span>
                    <Select
                      label="Assign to"
                      value={selectedTicket.assignedTo || ""}
                      onChange={(val) => handleAssignTicket(val)}
                      options={supportUsers}
                      className="ml-2 w-auto min-w-[100px] text-xs"
                      disabled={assigningLoading}
                    />
                  </div>
                )}
                {user?.role === "customer" && selectedTicket.assignedTo && (
                  <div className="flex items-center">
                    <UserCheck className="w-4 h-4 mr-2 text-gray-500" />
                    <span>
                      Assigned To:{" "}
                      <span className="font-semibold">
                        {selectedTicket.assignedTo}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Ticket Description */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-semibold mb-2 text-md">Description:</h3>
                <p className="text-gray-800 text-sm leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Chat Button (Now navigates to new route) */}
              <div className="flex justify-center items-center py-8">
                <button
                  onClick={() =>
                    navigate(`/tickets/${selectedTicket._id}/chat`)
                  } // Navigate to new chat route
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold shadow-md transition-colors"
                >
                  <MessageSquare size={24} />
                  <span>Open Chat</span>
                </button>
              </div>
              {/* REMOVED: All the chat interface components */}
            </div>
          ) : (
            <div className="text-center py-12 flex flex-col items-center justify-center h-full">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>

      <footer className="flex justify-center bg-gray-100 pb-4 text-sm">
        Made with ❤️ By{" "}
        <span className="font-bold text-purple-700 ml-1">Imroz</span>
      </footer>
    </div>
  );
};

export default Tickets;
