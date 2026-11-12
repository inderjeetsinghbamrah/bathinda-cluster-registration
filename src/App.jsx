import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AdminPortal } from './components/AdminPortal';
import { RegistrationClosed } from './components/RegistrationClosed';
import { RegistrationForm } from './components/RegistrationForm';
import { fetchPortalStatus } from './lib/portalStatus';

export function App() {
  const [isAdminView, setIsAdminView] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('admin-cluster-access') ||
      window.location.hash.includes('admin-cluster-access') ||
      window.location.search.includes('admin=cluster')
    );
  });

  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  useEffect(() => {
    const checkRoute = () => {
      setIsAdminView(
        window.location.pathname.includes('admin-cluster-access') ||
        window.location.hash.includes('admin-cluster-access') ||
        window.location.search.includes('admin=cluster')
      );
    };
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchPortalStatus()
      .then((res) => {
        if (isMounted && res && typeof res.isOpen === 'boolean') {
          setIsRegistrationOpen(res.isOpen);
          setIsLoadingStatus(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingStatus(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Admin Portal route
  if (isAdminView) {
    return <AdminPortal />;
  }

  // 2. Public route: Portal is CLOSED (Default)
  if (!isRegistrationOpen) {
    return (
      <RegistrationClosed
        onAdminAccess={() => {
          window.location.hash = 'admin-cluster-access';
          setIsAdminView(true);
        }}
      />
    );
  }

  // 3. Public route: Portal is OPEN
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar
        isClosed={false}
        onAdminClick={() => {
          window.location.hash = 'admin-cluster-access';
          setIsAdminView(true);
        }}
      />
      <main className="flex-1 pb-24 sm:pb-16">
        <RegistrationForm isAdminMode={false} />
      </main>
    </div>
  );
}

export default App;
