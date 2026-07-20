import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isToday(d))     return `Today, ${format(d, 'hh:mm a')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'hh:mm a')}`;
  return format(d, 'dd MMM yyyy, hh:mm a');
};

export const formatRelative = (dateStr) =>
  formatDistanceToNow(new Date(dateStr), { addSuffix: true });

export const formatDistance = (meters) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

export const formatRating = (val) => Number(val).toFixed(1);

export const truncate = (str, len = 60) =>
  str?.length > len ? `${str.slice(0, len)}…` : str;

export const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export const slugify = (str) =>
  str?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
