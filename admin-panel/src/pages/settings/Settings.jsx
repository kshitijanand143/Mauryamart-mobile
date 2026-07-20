import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../api/services';
import { PageLayout } from '../../components/layout';
import { PageLoader } from '../../components/common';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    adminAPI.settings()
      .then(r => setSettings(r.data.data))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLayout title="Platform Settings"><PageLoader /></PageLayout>;

  const items = [
    { label: 'Default Platform Commission', value: `${settings?.platformCommission}%`, desc: 'Default commission rate applied to new vendors' },
    { label: 'Free Delivery Threshold', value: `₹${settings?.freeDeliveryAbove}`, desc: 'Orders above this amount get free delivery' },
    { label: 'Platform Fee', value: `₹${settings?.platformFee}`, desc: 'Fixed fee added to every order' },
    { label: 'Default Delivery Fee', value: `₹${settings?.defaultDeliveryFee}`, desc: 'Charged when order is below free delivery threshold' },
  ];

  return (
    <PageLayout title="Platform Settings">
      <div className="card divide-y divide-gray-100">
        {items.map((item, i) => (
          <div key={i} className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
            <span className="text-lg font-bold text-brand-600">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="card p-5 mt-6 bg-blue-50 border-blue-100">
        <p className="text-sm text-blue-800">
          💡 These values are configured via environment variables on the server (<code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">PLATFORM_FEE</code>, <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">FREE_DELIVERY_ABOVE</code>, etc.).
          Per-vendor commission overrides can be set from the Vendors page.
        </p>
      </div>
    </PageLayout>
  );
}
