export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const ORDER_STATUS = {
  PLACED:           'placed',
  ACCEPTED:         'accepted',
  PREPARING:        'preparing',
  READY:            'ready',
  PICKED_UP:        'picked_up',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED:        'delivered',
  CANCELLED:        'cancelled',
};

export const ORDER_STATUS_LABEL = {
  placed:           'Order Placed',
  accepted:         'Order Accepted',
  preparing:        'Preparing',
  ready:            'Ready for Pickup',
  picked_up:        'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

export const ORDER_STATUS_COLOR = {
  placed:           'badge-gray',
  accepted:         'badge-orange',
  preparing:        'badge-orange',
  ready:            'badge-orange',
  picked_up:        'badge-orange',
  out_for_delivery: 'badge-orange',
  delivered:        'badge-green',
  cancelled:        'badge-red',
};

export const PAYMENT_METHOD = {
  ONLINE: 'online',
  COD:    'cod',
};

export const STORE_TYPE = {
  FOOD:        'food',
  ELECTRONICS: 'electronics',
  FASHION:     'fashion',
  GROCERY:     'grocery',
};

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

export const DEFAULT_LOCATION = { lat: 20.5937, lng: 78.9629 }; // India center

export const MAX_CART_QUANTITY = 20;
export const FREE_DELIVERY_THRESHOLD = 299;
export const PLATFORM_FEE = 5;

export const RATINGS = [1, 2, 3, 4, 5];
