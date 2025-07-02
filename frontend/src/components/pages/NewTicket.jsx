import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../lib/axios";
import { Ticket as TicketIcon, Pencil, FileText, Send } from "lucide-react";

const NewTicket = ({ user }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/tickets", {
        title,
        description,
      });
      navigate("/tickets");
    } catch (err) {
      console.error("Failed to create ticket:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 px-6 py-8 bg-white shadow-lg rounded-xl border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <TicketIcon className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-blue-700">Create New Ticket</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Pencil className="w-4 h-4 text-gray-500" />
            Title
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter ticket title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <FileText className="w-4 h-4 text-gray-500" />
            Description
          </label>
          <textarea
            rows="5"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Describe your issue in detail"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium transition duration-200"
        >
          <Send className="w-4 h-4" />
          Submit Ticket
        </button>
      </form>
    </div>
  );
};

export default NewTicket;
