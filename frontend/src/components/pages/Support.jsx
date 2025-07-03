import React, { useEffect, useState } from 'react';
import { axiosInstance } from '../../lib/axios';
import { User, ShieldCheck, Plus, X, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Supports = () => {
  const [supports, setSupports] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchSupports = async () => {
    try {
      const res = await axiosInstance.get('/users?role=support');
      setSupports(res.data);
    } catch (err) {
      console.error('Failed to fetch supports:', err);
    }
  };

  useEffect(() => {
    fetchSupports();
  }, []);

  const handleAddSupport = async (e) => {
    e.preventDefault();
    if (!username || !password) return toast.error("All fields required");
    setLoading(true);
    try {
      await axiosInstance.post('/users', {
        username,
        password,
        role: 'support',
      });
      toast.success("Support added");
      setUsername('');
      setPassword('');
      setShowForm(false);
      fetchSupports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add support');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/users/${id}`);
      toast.success('Support removed');
      fetchSupports();
    } catch (error) {
      toast.error('Failed to remove support');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto relative">
      <h1 className="text-2xl font-bold mb-4">Supports</h1>

      <button
        onClick={() => setShowForm(true)}
         className="fixed bottom-6 right-6 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 z-50"
      >
        <Plus size={24} />
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowForm(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus size={18} /> Add Support
            </h2>
            <form onSubmit={handleAddSupport} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {loading ? 'Adding...' : 'Add Support'}
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm relative">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-4">Are you sure you want to delete this support?</p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => {
                  handleDelete(confirmDelete);
                  setConfirmDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {supports.map((user) => (
          <div
            key={user._id}
            className="bg-gray-50 rounded-lg shadow p-4 flex flex-col gap-2 border"
          >
            <div className="flex items-center gap-2 text-gray-800">
              <User size={16} /> {user.username}
            </div>
            <div className="flex items-center gap-2 text-gray-500 justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} /> {user.role}
              </span>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => setConfirmDelete(user._id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Supports;
