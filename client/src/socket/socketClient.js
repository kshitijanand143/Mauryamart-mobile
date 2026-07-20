import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect:       false,
      withCredentials:   true,
      transports:        ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay:    2000,
    });
  }
  return socket;
};

export const connectSocket = (token) => {
  const s = getSocket();
  s.auth = { token };
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};

// Join a specific order's room for live updates
export const joinOrderRoom = (orderId) => {
  getSocket().emit('join:order', orderId);
};

export const leaveOrderRoom = (orderId) => {
  getSocket().emit('leave:order', orderId);
};

// Emit rider location (used by delivery boy app, imported in tracking hook)
export const emitRiderLocation = (orderId, coords) => {
  getSocket().emit('rider:location', { orderId, coords });
};
