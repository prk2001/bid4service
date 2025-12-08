'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/messages/conversations');
        const data = response.data?.data?.conversations || response.data?.data || response.data || []; setConversations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      {conversations.length === 0 ? (
        <p className="text-gray-500">No messages yet.</p>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv: any) => (
            <div key={conv.id} className="bg-white p-4 rounded-lg shadow border">
              <p className="font-semibold">{conv.otherUser?.firstName || 'User'}</p>
              <p className="text-sm text-gray-500">{conv.lastMessage || 'No messages'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
