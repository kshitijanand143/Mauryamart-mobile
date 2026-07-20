import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setNotifCount } from '@/redux/slices/uiSlice';
import { notificationService } from '@/api/services';
import { formatRelative } from '@/utils/formatters';
import { EmptyState } from '@/components/common';
import Spinner from '@/components/common/Spinner';
import PageLayout from '@/components/layout/PageLayout';
import toast from 'react-hot-toast';

const NOTIF_ICONS = {
  order:   '📦',
  payment: '💳',
  promo:   '🎉',
  system:  '🔔',
};

export default function Notifications() {
  const dispatch = useDispatch();
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [marking,  setMarking]  = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const { data } = await notificationService.getAll({ limit: 30 });
      const list = data.data || [];
      setNotifs(list);
      dispatch(setNotifCount(list.filter((n) => !n.isRead).length));
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markOne = async (id) => {
    setNotifs((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    try {
      await notificationService.markRead(id);
      dispatch(setNotifCount(notifs.filter((n) => !n.isRead && n._id !== id).length));
    } catch {}
  };

  const markAll = async () => {
    setMarking(true);
    try {
      await notificationService.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      dispatch(setNotifCount(0));
      toast.success('All marked as read');
    } catch { toast.error('Failed'); }
    finally { setMarking(false); }
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-900">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-sm font-medium text-brand-500">({unreadCount} new)</span>
            )}
          </h1>
          {unreadCount > 0 && (
            <button onClick={markAll} disabled={marking}
              className="text-sm text-brand-500 font-medium hover:text-brand-600 disabled:opacity-50">
              {marking ? <Spinner size="sm" /> : 'Mark all read'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : notifs.length === 0 ? (
          <EmptyState icon="🔔" title="No notifications yet" subtitle="We'll notify you about your orders and offers." />
        ) : (
          <div className="space-y-2">
            {notifs.map((n) => (
              <button
                key={n._id}
                onClick={() => !n.isRead && markOne(n._id)}
                className={`w-full text-left card p-4 flex items-start gap-3 transition-colors ${!n.isRead ? 'bg-brand-50 border border-brand-100 hover:bg-brand-100/50' : 'hover:bg-gray-50'}`}
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl flex-shrink-0 shadow-card">
                  {NOTIF_ICONS[n.type] || '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {n.title}
                    </p>
                    {!n.isRead && <span className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                  {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
