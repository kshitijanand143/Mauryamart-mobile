import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const fmtNum = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

export const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isToday(dt))     return `Today ${format(dt,'hh:mm a')}`;
  if (isYesterday(dt)) return `Yesterday ${format(dt,'hh:mm a')}`;
  return format(dt, 'dd MMM yyyy, hh:mm a');
};

export const fmtRel = (d) => d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '—';

export const STATUS_COLORS = {
  placed:'badge-gray', accepted:'badge-orange', preparing:'badge-orange',
  ready:'badge-orange', picked_up:'badge-orange', out_for_delivery:'badge-blue',
  delivered:'badge-green', cancelled:'badge-red',
  pending:'badge-orange', approved:'badge-green', rejected:'badge-red', suspended:'badge-red',
  paid:'badge-green', failed:'badge-red', initiated:'badge-gray',
  active:'badge-green', inactive:'badge-gray',
};

export const STATUS_LABELS = {
  placed:'Placed', accepted:'Accepted', preparing:'Preparing', ready:'Ready',
  picked_up:'Picked Up', out_for_delivery:'Out for Delivery', delivered:'Delivered', cancelled:'Cancelled',
  pending:'Pending', approved:'Approved', rejected:'Rejected', suspended:'Suspended',
  paid:'Paid', failed:'Failed', initiated:'Initiated',
};

export const truncate = (s, n=40) => s?.length > n ? s.slice(0,n)+'…' : (s || '—');
