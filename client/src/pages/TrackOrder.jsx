import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAccessToken } from '@/redux/slices/authSlice';
import { orderService } from '@/api/services';
import { useOrderTracking } from '@/hooks';
import { ORDER_STATUS_LABEL } from '@/utils/constants';
import { GOOGLE_MAPS_API_KEY } from '@/utils/constants';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import Spinner from '@/components/common/Spinner';
import PageLayout from '@/components/layout/PageLayout';

const MAP_LIBRARIES = ['places'];
const MAP_CONTAINER = { width: '100%', height: '100%' };
const MAP_OPTIONS   = { disableDefaultUI: true, zoomControl: true, styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }] };

export default function TrackOrder() {
  const { id }        = useParams();
  const accessToken   = useSelector(selectAccessToken);

  const [order,       setOrder]       = useState(null);
  const [riderCoords, setRiderCoords] = useState(null);
  const [directions,  setDirections]  = useState(null);
  const [eta,         setEta]         = useState(null);
  const [loading,     setLoading]     = useState(true);
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });

  // Initial order fetch
  useEffect(() => {
    (async () => {
      try {
        const { data } = await orderService.getById(id);
        setOrder(data.data);
        if (data.data?.riderLocation) {
          setRiderCoords({ lat: data.data.riderLocation.lat, lng: data.data.riderLocation.lng });
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id]);

  // Socket: live status + location
  const handleStatusChange = useCallback((payload) => {
    setOrder((o) => o ? { ...o, status: payload.status } : o);
  }, []);

  const handleLocationUpdate = useCallback(({ coords }) => {
    setRiderCoords(coords);
  }, []);

  useOrderTracking(id, handleStatusChange, handleLocationUpdate);

  // Build directions when rider location and delivery address are known
  useEffect(() => {
    if (!isLoaded || !riderCoords || !order?.address) return;
    const svc = new window.google.maps.DirectionsService();
    const dest = `${order.address.addressLine1}, ${order.address.city}, ${order.address.state} ${order.address.pincode}`;
    svc.route({
      origin:      new window.google.maps.LatLng(riderCoords.lat, riderCoords.lng),
      destination: dest,
      travelMode:  window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') {
        setDirections(result);
        setEta(result.routes[0]?.legs[0]?.duration?.text);
      }
    });
  }, [riderCoords, order?.address, isLoaded]);

  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);

  const deliveredOrCancelled = ['delivered', 'cancelled'].includes(order?.status);

  if (loading) return (
    <PageLayout>
      <div className="flex justify-center py-16"><Spinner size="lg" /></div>
    </PageLayout>
  );

  return (
    <PageLayout noPad>
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Map */}
        <div className="flex-1 relative">
          {isLoaded && order ? (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER}
              center={riderCoords || { lat: 20.5937, lng: 78.9629 }}
              zoom={riderCoords ? 14 : 6}
              options={MAP_OPTIONS}
              onLoad={onMapLoad}
            >
              {riderCoords && (
                <Marker
                  position={riderCoords}
                  icon={{
                    url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="#f97316" stroke="white" stroke-width="3"/>
                        <text x="20" y="26" text-anchor="middle" font-size="18" fill="white">🛵</text>
                      </svg>`),
                    scaledSize: isLoaded ? new window.google.maps.Size(40, 40) : undefined,
                  }}
                />
              )}
              {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: false, polylineOptions: { strokeColor: '#f97316', strokeWeight: 4 } }} />}
            </GoogleMap>
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          )}

          {/* ETA overlay */}
          {eta && riderCoords && !deliveredOrCancelled && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-float px-4 py-2 flex items-center gap-2">
              <span className="text-lg">🛵</span>
              <div>
                <p className="text-xs text-gray-500">Estimated arrival</p>
                <p className="text-sm font-bold text-gray-900">{eta}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom panel */}
        <div className="bg-white border-t border-gray-200 px-4 pt-4 pb-safe">
          {order && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">Order #{order.orderNumber || id.slice(-8).toUpperCase()}</p>
                  <p className="text-base font-bold text-gray-900">{ORDER_STATUS_LABEL[order.status] || order.status}</p>
                </div>
                {order.riderPhone && !deliveredOrCancelled && (
                  <a href={`tel:${order.riderPhone}`}
                    className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Status steps */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {['placed', 'preparing', 'out_for_delivery', 'delivered'].map((step, i) => {
                  const steps  = ['placed', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered'];
                  const done   = steps.indexOf(order.status) >= steps.indexOf(step);
                  return (
                    <React.Fragment key={step}>
                      <div className={`flex-shrink-0 flex flex-col items-center gap-1`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${done ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span className={`text-[10px] whitespace-nowrap ${done ? 'text-brand-600 font-medium' : 'text-gray-400'}`}>
                          {ORDER_STATUS_LABEL[step]}
                        </span>
                      </div>
                      {i < 3 && <div className={`flex-1 h-0.5 ${done ? 'bg-brand-500' : 'bg-gray-200'} mt-[-10px]`} />}
                    </React.Fragment>
                  );
                })}
              </div>

              {deliveredOrCancelled && (
                <Link to={`/orders/${id}`} className="btn-primary w-full mt-3 text-center block">
                  View order details
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
