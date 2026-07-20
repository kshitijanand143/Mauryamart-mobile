'use strict';
/**
 * utils/notify.js  — Complete notification dispatcher
 * Saves Notification to MongoDB + sends FCM push for all event types.
 */

const Notification = require('../modules/notification/notification.model');
const { sendPushNotification } = require('../config/firebase');
const logger = require('../config/logger');

// ── Core ──────────────────────────────────────────────────────────────────────
const notify = async ({ userId, title, body, type = 'system', data = {}, fcmToken = null, push = true }) => {
  try {
    const notif = await Notification.create({ userId, title, body, type, data });
    if (push && fcmToken) {
      await sendPushNotification(fcmToken, {
        title, body,
        data: { notifId: String(notif._id), type, ...data },
      });
    }
    return notif;
  } catch (err) {
    logger.error('notify() error:', err.message);
  }
};

// ── Order status ──────────────────────────────────────────────────────────────
const ORDER_MESSAGES = {
  placed:           { title: '🧾 Order placed!',         body: o => `Order #${o.orderNumber} placed. Total: ₹${o.totalAmount}.` },
  accepted:         { title: '✅ Order accepted',         body: o => `Your order #${o.orderNumber} has been accepted by the vendor.` },
  preparing:        { title: '👨‍🍳 Preparing your order', body: o => `Order #${o.orderNumber} is being prepared!` },
  ready:            { title: '📦 Order ready',            body: o => `Order #${o.orderNumber} is ready for pickup.` },
  picked_up:        { title: '🛵 Order picked up',        body: o => `Delivery partner has picked up order #${o.orderNumber}.` },
  out_for_delivery: { title: '🛵 Out for delivery!',     body: o => `Order #${o.orderNumber} is on its way!` },
  delivered:        { title: '🎉 Order delivered!',       body: o => `Order #${o.orderNumber} delivered. Enjoy your meal! Leave a review.` },
  cancelled:        { title: '❌ Order cancelled',        body: o => `Order #${o.orderNumber} has been cancelled.` },
};

const notifyOrderStatus = async (order, populatedCustomer) => {
  const msg = ORDER_MESSAGES[order.status];
  if (!msg || !populatedCustomer) return;
  await notify({
    userId:   populatedCustomer._id,
    title:    msg.title,
    body:     msg.body(order),
    type:     'order',
    data:     { orderId: String(order._id), orderNumber: order.orderNumber, status: order.status },
    fcmToken: populatedCustomer.fcmToken || null,
  });
};

// ── Payment ───────────────────────────────────────────────────────────────────
const notifyPayment = async ({ userId, fcmToken, status, amount, orderId, orderNumber }) => {
  const messages = {
    paid:     { title: '💳 Payment successful', body: `Payment of ₹${amount} confirmed for order #${orderNumber}.` },
    failed:   { title: '❌ Payment failed',      body: `Payment for order #${orderNumber} failed. Please retry.` },
    refunded: { title: '💸 Refund initiated',    body: `₹${amount} refund for order #${orderNumber} initiated. Expect in 5–7 days.` },
  };
  const msg = messages[status];
  if (!msg) return;
  await notify({ userId, title: msg.title, body: msg.body, type: 'payment',
    data: { orderId: String(orderId), orderNumber, status, amount: String(amount) }, fcmToken });
};

// ── Promo broadcast ───────────────────────────────────────────────────────────
const notifyPromo = async (recipients, { title, body, data = {} }) => {
  if (!recipients?.length) return;
  const docs = recipients.map(r => ({ userId: r.userId, title, body, type: 'promo', data }));
  try { await Notification.insertMany(docs, { ordered: false }); } catch (e) { logger.warn('notifyPromo partial:', e.message); }
  const tokens = recipients.map(r => r.fcmToken).filter(Boolean);
  if (tokens.length) await sendPushNotification(tokens, { title, body, data });
};

// ── System / vendor / rider helpers ───────────────────────────────────────────
const notifySystem = async ({ userId, fcmToken, title, body, data = {} }) =>
  notify({ userId, title, body, type: 'system', data, fcmToken });

const notifyVendorNewOrder = async ({ vendorUserId, fcmToken, orderNumber, orderId }) =>
  notify({
    userId: vendorUserId, type: 'order', fcmToken,
    title:  '🔔 New order received!',
    body:   `Order #${orderNumber} is waiting for your confirmation.`,
    data:   { orderId: String(orderId), orderNumber },
  });

const notifyRiderAssigned = async ({ riderUserId, fcmToken, orderNumber, orderId }) =>
  notify({
    userId: riderUserId, type: 'order', fcmToken,
    title:  '📦 New delivery assigned',
    body:   `Order #${orderNumber} has been assigned to you.`,
    data:   { orderId: String(orderId), orderNumber },
  });

module.exports = {
  notify,
  notifyOrderStatus,
  notifyPayment,
  notifyPromo,
  notifySystem,
  notifyVendorNewOrder,
  notifyRiderAssigned,
};
