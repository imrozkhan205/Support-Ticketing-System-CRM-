import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { ShieldCheck, Mail, User } from "lucide-react";

const Supports = () => {
  const [supports, setSupports] = useState([]);
  const [error, setError] = useState(null);

  const fetchSupports = async () => {
    try {
      const response = await axiosInstance.get("/users?role=support");
      setSupports(response.data);
    } catch (err) {
      setError("Failed to load support users");
    }
  };

  useEffect(() => {
    fetchSupports();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-blue-700">Support Team</h1>
      </div>

      {error ? (
        <p className="text-red-600">{error}</p>
      ) : supports.length === 0 ? (
        <p className="text-gray-500">No supports found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supports.map((support) => (
            <div
              key={support._id}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="font-semibold text-gray-800">{support.username}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{support.email}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Supports;
