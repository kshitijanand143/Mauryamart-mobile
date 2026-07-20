import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminMe, selectAdmin } from './redux/store';
import AppRoutes from './routes/AppRoutes';
import { PageLoader } from './components/common';

export default function App() {
  const dispatch = useDispatch();
  const { accessToken } = useSelector(selectAdmin);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchAdminMe()).finally(() => setChecked(true));
    } else {
      setChecked(true);
    }
  }, []);

  if (!checked) return <div className="min-h-screen flex items-center justify-center"><PageLoader /></div>;
  return <AppRoutes />;
}
