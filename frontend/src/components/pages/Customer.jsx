import React, { useEffect, useState } from 'react';
import { axiosInstance } from '../../lib/axios';
import { User, Users, Plus, X, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);          // for add
  const [fetching, setFetching] = useState(false);        // for fetching customers
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchCustomers = async () => {
    setFetching(true);
    try {
      const res = await axiosInstance.get('/users?role=customer');
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      toast.error("Failed to load customers");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!username || !password) return toast.error("All fields required");
    setLoading(true);
    try {
      await axiosInstance.post('/users', {
        username,
        password,
        role: 'customer',
      });
      toast.success("Customer added");
      setUsername('');
      setPassword('');
      setShowForm(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/users/${confirmDelete}`);
      toast.success("Customer deleted");
      fetchCustomers();
    } catch (err) {
      toast.error("Failed to delete customer");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto relative">
      <h1 className="text-2xl font-bold mb-4">Customers</h1>

      {/* Add button */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 z-50"
      >
        <Plus size={24} />
      </button>

      {/* Add customer modal */}
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
              <Plus size={18} /> Add Customer
            </h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
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
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex justify-center items-center"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Add Customer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-xl text-center">
            <p className="mb-4 text-lg font-medium">Are you sure you want to delete this customer?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading spinner when fetching */}
      {fetching ? (
        <div className="flex justify-center items-center mt-10">
          <Loader2 className="animate-spin text-green-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {customers.map((user) => (
            <div
              key={user._id}
              className="bg-gray-50 rounded-lg shadow p-4 flex justify-between items-center border"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-gray-800">
                  <User size={16} /> {user.username}
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Users size={16} /> {user.role}
                </div>
              </div>
              <button
                onClick={() => setConfirmDelete(user._id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Customers;
