import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { axiosInstance } from '../../lib/axios';
import { Calendar, User, UserCheck, MessageCircle, CornerDownRight, Reply } from 'lucide-react';

const TicketDetail = ({ user }) => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [activeReplyPath, setActiveReplyPath] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  const fetchTicket = async () => {
    try {
      const response = await axiosInstance.get(`/tickets/${id}`);
      setTicket(response.data);
    } catch (err) {
      setError('Failed to load ticket');
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await axiosInstance.post(`/tickets/${id}/comments`, { message: newComment });
      setNewComment('');
      fetchTicket();
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleAddReply = async (path) => {
    if (!replyMessage.trim()) return;
    try {
      await axiosInstance.post(`/tickets/${id}/comments`, {
        message: replyMessage,
        parentCommentPath: path,
      });
      setReplyMessage('');
      setActiveReplyPath(null);
      fetchTicket();
    } catch (err) {
      console.error("Failed to add reply:", err);
    }
  };

  const renderComments = (comments, path = []) => {
    return comments.map((comment, index) => {
      const currentPath = [...path, index];
      const pathKey = currentPath.join('-');

      return (
        <div key={pathKey} className="mb-4 ml-4 border-l-2 pl-4 border-blue-200">
          <p className="text-sm text-gray-800">
            <span className="font-semibold">{comment.user}</span>: {comment.message}
          </p>
          <p className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</p>

          <button
            onClick={() => setActiveReplyPath(currentPath)}
            className="text-sm text-blue-600 mt-1 hover:underline flex items-center gap-1"
          >
            <Reply className="w-4 h-4" /> Reply
          </button>

          {activeReplyPath && pathKey === activeReplyPath.join('-') && (
            <div className="mt-2">
              <textarea
                className="w-full p-2 border border-gray-300 rounded mb-2"
                rows="2"
                placeholder="Write a reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddReply(currentPath)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Post Reply
                </button>
                <button
                  onClick={() => {
                    setReplyMessage('');
                    setActiveReplyPath(null);
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-4 mt-2">
              {renderComments(comment.replies, currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!ticket) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md space-y-6">
      <h1 className="text-2xl font-bold">{ticket.title}</h1>
      <p className="text-gray-600">{ticket.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          Created At: {new Date(ticket.createdAt).toLocaleString()}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <User className="w-4 h-4" />
          Created By: {ticket.createdBy}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <UserCheck className="w-4 h-4" />
          Assigned To: {ticket.assignedTo || 'Unassigned'}
        </div>
        <div className="text-sm text-gray-600">
          Status: <span className="font-semibold">{ticket.status}</span>
        </div>
      </div>

      {/* Comments */}
      <div>
        <h2 className="text-lg font-semibold mt-6 mb-2 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" /> Comments
        </h2>

        {ticket.comments.length === 0 ? (
          <p className="text-gray-400">No comments yet.</p>
        ) : (
          renderComments(ticket.comments)
        )}

        {/* New Comment Form */}
        <div className="mt-6">
          <textarea
            className="w-full p-2 border border-gray-300 rounded mb-2"
            rows="3"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            onClick={handleAddComment}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Post Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
