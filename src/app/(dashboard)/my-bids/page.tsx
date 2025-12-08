'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function MyBidsPage() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBid, setEditingBid] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchBids = async () => {
    try {
      const response = await api.get('/bids/my-bids');
      setBids(response.data?.data?.bids || response.data?.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBids(); }, []);

  const handleUpdateBid = async (bid) => {
    const newAmount = parseFloat(editAmount);
    if (bid.status === 'ACCEPTED' && newAmount < bid.amount) {
      setMessage({ type: 'error', text: 'Can only increase accepted bids' });
      return;
    }
    try {
      await api.put('/bids/' + bid.id, { amount: newAmount });
      setMessage({ type: 'success', text: 'Bid updated!' });
      setEditingBid(null);
      fetchBids();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update bid' });
    }
  };

  const handleCancelBid = async (bidId) => {
    if (!confirm('Cancel this bid?')) return;
    try {
      await api.delete('/bids/' + bidId);
      setMessage({ type: 'success', text: 'Bid cancelled!' });
      fetchBids();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to cancel bid' });
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Bids</h1>
      
      {message.text && (
        <div className={`px-4 py-3 rounded mb-4 ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`}>
          {message.text}
        </div>
      )}

      {bids.length === 0 ? (
        <p className="text-gray-500">No bids yet.</p>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div key={bid.id} className="bg-white p-5 rounded-lg shadow-md border border-gray-200 flex justify-between items-center">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">{bid.job?.title || 'Job'}</h3>
                {editingBid === bid.id ? (
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-gray-600 font-medium">$</span>
                    <input 
                      type="number" 
                      value={editAmount} 
                      onChange={(e) => setEditAmount(e.target.value)} 
                      className="border-2 border-gray-300 rounded-lg px-3 py-2 w-32 text-lg focus:border-blue-500 focus:outline-none" 
                    />
                    <button onClick={() => handleUpdateBid(bid)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700">Save</button>
                    <button onClick={() => setEditingBid(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300">Cancel</button>
                  </div>
                ) : (
                  <p className="text-green-600 font-bold text-2xl mt-1">${bid.amount}</p>
                )}
                <div className="mt-3">
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    bid.status === 'PENDING' ? 'bg-yellow-400 text-yellow-900' : 
                    bid.status === 'ACCEPTED' ? 'bg-green-500 text-white' : 
                    bid.status === 'REJECTED' ? 'bg-red-500 text-white' :
                    'bg-gray-400 text-white'
                  }`}>
                    {bid.status}
                  </span>
                </div>
              </div>
              {editingBid !== bid.id && (
                <div className="flex flex-col gap-3 ml-6">
                  {(bid.status === 'PENDING' || bid.status === 'ACCEPTED') && (
                    <button 
                      onClick={() => { setEditingBid(bid.id); setEditAmount(bid.amount.toString()); }} 
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 min-w-24"
                    >
                      {bid.status === 'ACCEPTED' ? 'Increase' : 'Edit'}
                    </button>
                  )}
                  {bid.status === 'PENDING' && (
                    <button 
                      onClick={() => handleCancelBid(bid.id)} 
                      className="bg-red-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-red-700 min-w-24"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}