import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../api/services';
import { PageLayout } from '../../components/layout';
import { StatCard, PageLoader, StatusBadge } from '../../components/common';
import { fmt, fmtNum, fmtDate } from '../../utils/helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [d, r] = await Promise.all([adminAPI.dashboard(), adminAPI.revenueAnalytics(14)]);
        setData(d.data.data);
        setRevenue(r.data.data.daily.map(x => ({ date: x._id.slice(5), revenue: x.revenue, orders: x.orders })));
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <PageLayout title="Dashboard"><PageLoader /></PageLayout>;

  const { stats, recentOrders } = data || {};

  return (
    <PageLayout title="Dashboard">
      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Revenue" value={fmt(stats?.totalRevenue)} sub="All time platform earnings" icon="💰" color="green" />
        <StatCard title="This Month" value={fmt(stats?.monthRevenue)} sub={`${fmtNum(stats?.monthOrders)} orders`} icon="📈" color="brand" />
        <StatCard title="Today's Orders" value={fmtNum(stats?.todayOrders)} sub={`${fmtNum(stats?.totalOrders)} total orders`} icon="📦" color="blue" />
        <StatCard title="Active Customers" value={fmtNum(stats?.totalUsers)} sub="Registered customers" icon="👥" color="purple" />
      </div>

      {/* Pending approvals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Link to="/vendors" className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs text-gray-500">Pending Vendors</p>
            <p className="text-xl font-bold text-orange-600">{fmtNum(stats?.pendingVendors)}</p>
          </div>
          <span className="text-2xl">🏪</span>
        </Link>
        <Link to="/delivery" className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs text-gray-500">Pending Riders</p>
            <p className="text-xl font-bold text-orange-600">{fmtNum(stats?.pendingRiders)}</p>
          </div>
          <span className="text-2xl">🛵</span>
        </Link>
        <Link to="/vendors" className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs text-gray-500">Active Vendors</p>
            <p className="text-xl font-bold text-green-600">{fmtNum(stats?.totalVendors)}</p>
          </div>
          <span className="text-2xl">✅</span>
        </Link>
      </div>

      {/* Revenue chart */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue — Last 14 days</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={revenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip formatter={(v) => fmt(v)} />
            <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Orders by day */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Orders — Last 14 days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="orders" fill="#fb923c" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
          <Link to="/orders" className="text-xs text-brand-500 font-medium hover:text-brand-600">View all →</Link>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-th">Order</th>
              <th className="table-th">Customer</th>
              <th className="table-th">Vendor</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Status</th>
              <th className="table-th">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentOrders?.map(o => (
              <tr key={o._id} className="hover:bg-gray-50">
                <td className="table-td font-medium">#{o.orderNumber}</td>
                <td className="table-td">{o.customerId?.name || '—'}</td>
                <td className="table-td">{o.vendorId?.storeName || '—'}</td>
                <td className="table-td font-semibold">{fmt(o.totalAmount)}</td>
                <td className="table-td"><StatusBadge status={o.status} /></td>
                <td className="table-td text-gray-400">{fmtDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageLayout>
  );
}
