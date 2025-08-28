import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  User,
  Shield,
  Check,
  Reply,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../../lib/axios";
import io from "socket.io-client";

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || "https://sts-a6ed.onrender.com/";


const ChatPage = ({ user }) => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const socketRef = useRef(null); // Ref to hold the socket instance

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const resolveInReplyTo = (replyId, allComments) => {
    if (!replyId || !allComments) return null;

    if (typeof replyId !== "string" && replyId._id) {
      return replyId;
    }

    return allComments.find((c) => c._id === replyId);
  };

  useEffect(() => {
    console.log("Current URL params:", { ticketId });
    console.log("Current pathname:", window.location.pathname);

    if (!ticketId) {
      console.log("No ticketId found in URL parameters");
      setError(
        "No ticket ID provided in the URL. Please access this page from a ticket link."
      );
      setLoadingTicket(false);
      return;
    }

    const fetchTicket = async () => {
      setLoadingTicket(true);
      setError(null);

      try {
        console.log("Fetching ticket with ID:", ticketId);
        console.log("Making request to:", `/tickets/${ticketId}`);

        const response = await axiosInstance.get(`/tickets/${ticketId}`);
        console.log("Ticket response:", response.data);

        setSelectedTicket(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to load ticket for chat:", err);
        console.error("Error details:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
        });

        let errorMessage = "Failed to load ticket for chat.";

        if (err.response?.status === 404) {
          errorMessage =
            "Ticket not found. It may have been deleted or you don't have access to it.";
        } else if (err.response?.status === 401) {
          errorMessage =
            "You are not authorized to view this ticket. Please log in again.";
        } else if (err.response?.status === 403) {
          errorMessage = "You don't have permission to access this ticket.";
        } else if (err.response?.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (!err.response) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }

        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoadingTicket(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId || !user) return; 

    // Initialize socket connection
    socketRef.current = io(SOCKET_SERVER_URL, {
      query: { userId: user._id }, 
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
      // Join the ticket-specific room
      socketRef.current.emit("joinTicketRoom", ticketId);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      toast.error("Real-time chat connection failed.");
    });

    // Listen for new messages
    socketRef.current.on("newComment", (newComment) => {
      console.log("Received new comment via socket:", newComment);
      // Update the selectedTicket's comments array
      setSelectedTicket((prev) => {
        // Prevent duplicate comments if the optimistic update was already replaced by the server response
        const isDuplicate = prev.comments.some(
          (comment) => comment._id === newComment._id
        );
        if (isDuplicate) {
          return prev;
        }

        // Find and replace the optimistic comment if it exists, otherwise just add
        return {
          ...prev,
          comments: (prev.comments || []).map((c) =>
            c.isOptimistic && c.message === newComment.message && c.user === newComment.user
              ? { ...newComment, isOptimistic: false } // Replace with actual and remove optimistic flag
              : c
          ).some((c) => c._id === newComment._id) // Check if newComment was already added via replacement
            ? prev.comments.map((c) =>
                c.isOptimistic && c.message === newComment.message && c.user === newComment.user
                  ? { ...newComment, isOptimistic: false } // Replace with actual and remove optimistic flag
                  : c
              )
            : [...(prev.comments || []).filter((c) => !c.isOptimistic), newComment], // Add if not replaced/duplicated
        };
      });
    });

    // Listen for deleted comments (if you implement this functionality)
    socketRef.current.on("commentDeleted", (commentId) => {
      setSelectedTicket((prev) => ({
        ...prev,
        comments: prev.comments.filter((comment) => comment._id !== commentId),
      }));
      toast.info("A message was deleted.");
    });

    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        console.log("Leaving ticket room:", ticketId);
        socketRef.current.emit("leaveTicketRoom", ticketId);
        socketRef.current.disconnect();
      }
    };
  }, [ticketId, user]); // Re-run if ticketId or user changes

  // Scroll to bottom effect for chat messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [selectedTicket?.comments?.length, selectedTicket?.comments]); // Depend on the array reference as well

  const handleReply = (comment) => {
    setReplyingToMessage(comment);
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  const clearReply = () => {
    setReplyingToMessage(null);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || sendingMessage) return;

    setSendingMessage(true);
    const messageText = newMessage.trim();
    const tempId = `optimistic-${Date.now()}`; // Unique temporary ID for optimistic update

    const optimisticComment = {
      _id: tempId,
      message: messageText,
      user: user.username,
      role: user.role,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      inReplyTo: replyingToMessage
        ? {
            _id: replyingToMessage._id,
            message: replyingToMessage.message,
            user: replyingToMessage.user,
          }
        : undefined,
    };

    // Optimistically update the UI
    setSelectedTicket((prev) => ({
      ...prev,
      comments: [...(prev.comments || []), optimisticComment],
    }));
    setNewMessage(""); // Clear input immediately
    clearReply(); // Clear reply state immediately for new message input

    try {
      const payload = {
        message: messageText,
        user: user.username,
        role: user.role,
        ticketId: selectedTicket._id, // Ensure ticketId is sent for the server to associate
      };
      if (replyingToMessage) {
        payload.inReplyTo = replyingToMessage._id;
      }

      const res = await axiosInstance.post(
        `/tickets/${selectedTicket._id}/comments`,
        payload
      );
      setSelectedTicket((prev) => {
        const updatedComments = (prev.comments || []).map((comment) =>
          comment._id === optimisticComment._id
            ? { ...res.data, isOptimistic: false } // Replace optimistic with actual data
            : comment
        );
        const actualCommentAlreadyPresent = updatedComments.some(
          (c) => c._id === res.data._id
        );
        if (!actualCommentAlreadyPresent) {
          updatedComments.push({ ...res.data, isOptimistic: false });
        }
        return { ...prev, comments: updatedComments };
      });

      toast.success("Message sent successfully");
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");

      // Rollback optimistic update on error
      setSelectedTicket((prev) => ({
        ...prev,
        comments: (prev.comments || []).filter((c) => c._id !== optimisticComment._id), // Remove the specific optimistic comment
      }));
      setNewMessage(messageText); // Restore message
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
      case "support":
        return <Shield className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-700 border-red-200";
      case "support":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-gray-700 border-gray-200";
    }
  };

  const scrollToOriginal = (originalId) => {
    if (!originalId) return;
    const el = document.getElementById(`msg-${originalId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-gray-100", "rounded-md");
      setTimeout(() => {
        el.classList.remove("bg-gray-100", "bg-gray-100", "rounded");
      }, 500);
    }
  };

  if (loadingTicket) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Chat
          </h3>
          <p className="text-gray-600 mb-4">
            Please wait while we fetch your conversation...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to Load Chat
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="text-xs text-gray-400 mb-6">
            Ticket ID: {ticketId || "Not provided"}
            <br />
            Current URL: {window.location.pathname}
            <br />
            Expected URL format: /tickets/[ticketId]
          </div>
          <div className="flex space-x-2 justify-center">
            <button
              onClick={() => navigate("/tickets")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Go to Tickets
            </button>
            <button
              onClick={() => navigate("/tickets")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              View All Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedTicket) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ticket Not Found
          </h3>
          <p className="text-gray-600 mb-6">
            The requested ticket could not be found.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[620px] bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/tickets")}
              className="flex items-center text-slate-600 hover:text-slate-900 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm">Tickets</span>
            </button>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-slate-900">
                  Ticket #{selectedTicket._id.slice(-6).toUpperCase()}
                </h1>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center">
          Ticket of:{" "}
          <span className="font-semibold">{selectedTicket.createdBy}</span>
          <p>
            Assigned To:{" "}
            <span className="font-semibold">
              {selectedTicket.assignedTo || "Unassigned"}
            </span>{" "}
            {/* Use selectedTicket here */}
          </p>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 p-3 min-h-0">
        <div className="w-full max-w-3xl mx-auto h-[500px] bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-slate-50/30 to-white">
            {!selectedTicket.comments ||
            selectedTicket.comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                  <MessageCircle className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-900 mb-1">
                  No Messages Yet
                </h3>
                <p className="text-slate-500 text-xs max-w-xs">
                  Start the conversation by sending your first message below.
                </p>
              </div>
            ) : (
              <>
                {selectedTicket.comments.map((comment, index) => {
                  const isOwnMessage = comment.user === user.username;

                  const resolvedReplyTo = comment.inReplyTo
                    ? resolveInReplyTo(
                        comment.inReplyTo,
                        selectedTicket.comments
                      )
                    : null;

                  return (
                    <div
                      key={comment._id || `temp-${index}`}
                      id={`msg-${comment._id}`}
                      className={`flex ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs relative group ${
                          isOwnMessage ? "order-2" : "order-1"
                        }`}
                      >
                        <button
                          onClick={() => handleReply(comment)}
                          className={`absolute top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-800 opacity-0 group-hover:opacity-100 transition
                              ${
                                isOwnMessage
                                  ? "left-[-35px] md:left-[-45px]"
                                  : "right-[-35px] md:right-[-45px]"
                              }
                            `}
                          title="Reply"
                        >
                          <Reply className="w-4 mx-2 h-4" />
                        </button>

                        <div
                          className={`relative p-2.5 rounded-lg shadow-sm border
                              ${
                                isOwnMessage
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-900 border-slate-200"
                              }
                              ${comment.isOptimistic ? "opacity-70" : ""}
                            `}
                        >
                          {comment.isOptimistic && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                          )}

                          {resolvedReplyTo && (
                            <div
                              className={`mb-1 p-2 rounded-lg text-xs border-l-2 cursor-pointer transition-all ${
                                isOwnMessage
                                  ? "bg-white/10 border-white/30 text-white/80"
                                  : "bg-slate-100 border-slate-300 text-slate-700"
                              }`}
                              onClick={() =>
                                scrollToOriginal(resolvedReplyTo._id)
                              }
                              title="Click to view original message"
                            >
                              <div className="flex items-center space-x-1 mb-0.5">
                                <Reply className="w-3 h-3 flex-shrink-0" />
                                <span className="font-semibold text-slate-350 flex-shrink-0">
                                  {resolvedReplyTo.user} :{" "}
                                </span>
                                <span className="font-normal flex-1 overflow-hidden whitespace-nowrap text-ellipsis">
                                  {resolvedReplyTo.message}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-1">
                              <span
                                className={`text-xs font-semibold ${
                                  isOwnMessage
                                    ? "text-blue-100"
                                    : "text-slate-700"
                                }`}
                              >
                                {comment.user}
                              </span>
                              {comment.role && (
                                <div
                                  className={`flex items-center px-1 py-0.5 rounded text-xs font-medium ${
                                    isOwnMessage
                                      ? "bg-blue-500 text-blue-100"
                                      : getRoleBadgeColor(comment.role)
                                  }`}
                                >
                                  {getRoleIcon(comment.role)}
                                </div>
                              )}
                            </div>
                            <div
                              className={`flex items-center space-x-1 text-xs opacity-75 ${
                                isOwnMessage
                                  ? "text-blue-100"
                                  : "text-slate-500"
                              }`}
                            >
                              <Check className="w-2 h-2" />
                              <span className="text-xs">
                                {formatTime(comment.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`text-xs leading-relaxed break-words ${
                              isOwnMessage ? "text-white" : "text-slate-800"
                            }`}
                          >
                            {comment.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {replyingToMessage && (
            <div
              className={`bg-blue-50 text-blue-800 p-3 rounded-t-xl border-b border-blue-200 flex items-center justify-between text-sm transition-all duration-300 ease-out transform translate-y-0 opacity-100`}
            >
              <div>
                <span className="font-semibold">
                  Replying to {replyingToMessage.user}:
                </span>{" "}
                <span className="truncate max-w-[190px] -">
                  {replyingToMessage.message}
                </span>
              </div>
              <button
                onClick={clearReply}
                className="text-blue-600 hover:text-blue-900 ml-2 p-1 rounded-full hover:bg-blue-100"
                title="Clear reply"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="border-t border-slate-200 bg-white p-3 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <textarea
                  ref={messageInputRef}
                  type="text"
                  placeholder="Type your message..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white focus:bg-white text-sm resize-none overflow-y-hidden"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !sendingMessage) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sendingMessage}
                ></textarea>
              </div>
              <button
                onClick={handleSendMessage}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1 text-sm ${
                  !newMessage.trim() || sendingMessage
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                disabled={!newMessage.trim() || sendingMessage}
              >
                {sendingMessage ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;