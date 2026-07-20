import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../api/services';
import { PageLayout } from '../../components/layout';
import { PageLoader, Select } from '../../components/common';
import { fmt, fmtNum } from '../../utils/helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

const RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' },
];
const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#fff7ed'];

export default function Reports() {
  const [days, setDays]       = useState('30');
  const [data, setData]       = useState(null);
  const [orderStats, setOrderStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rev, stats] = await Promise.all([adminAPI.revenueAnalytics(days), adminAPI.orderStats()]);
        setData(rev.data.data);
        setOrderStats(stats.data.data);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [days]);

  if (loading) return <PageLayout title="Reports & Analytics"><PageLoader /></PageLayout>;

  const dailyChart = data?.daily.map(d => ({ date: d._id.slice(5), revenue: d.revenue, orders: d.orders, earning: d.platformEarning })) || [];
  const totalRevenue  = data?.daily.reduce((s, d) => s + d.revenue, 0) || 0;
  const totalEarning  = data?.daily.reduce((s, d) => s + d.platformEarning, 0) || 0;
  const totalOrders   = data?.daily.reduce((s, d) => s + d.orders, 0) || 0;

  return (
    <PageLayout title="Reports & Analytics">
      <div className="flex justify-end mb-4">
        <Select value={days} onChange={setDays} options={RANGE_OPTIONS} className="w-44" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5"><p className="text-xs text-gray-500 uppercase">Gross Revenue</p><p className="text-2xl font-bold text-gray-900 mt-1">{fmt(totalRevenue)}</p></div>
        <div className="card p-5"><p className="text-xs text-gray-500 uppercase">Platform Earnings</p><p className="text-2xl font-bold text-green-600 mt-1">{fmt(totalEarning)}</p></div>
        <div className="card p-5"><p className="text-xs text-gray-500 uppercase">Total Orders</p><p className="text-2xl font-bold text-gray-900 mt-1">{fmtNum(totalOrders)}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip formatter={v => fmt(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="earning" stroke="#22c55e" strokeWidth={2} name="Platform earning" />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Order status breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={orderStats} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, count }) => `${status}: ${count}`}>
                {orderStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Top performing vendors</h2>
        <table className="w-full">
          <thead><tr><th className="table-th">Vendor</th><th className="table-th">Orders</th><th className="table-th">Revenue</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data?.byVendor?.map((v, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="table-td font-medium">{v.storeName}</td>
                <td className="table-td">{fmtNum(v.orders)}</td>
                <td className="table-td font-semibold">{fmt(v.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageLayout>
  );
}
