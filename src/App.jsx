import React, { useState, useEffect } from 'react';
import { supabase } from './supabase/supabaseClient.js';
import Layout from './components/Layout.jsx';
import QuickCalc from './components/QuickCalc.jsx';
import Auth from './components/Auth.jsx';
import Dashboard from './components/Dashboard.jsx';
import Calendar from './components/Calendar.jsx';
import Settings from './components/Settings.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('quickCalc');
  const [couriers, setCouriers] = useState([]);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [logs, setLogs] = useState([]);

  // Handle auth session state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setCurrentTab('dashboard');
        fetchCouriers(session.user.id);
      } else {
        setCurrentTab('quickCalc');
        setCouriers([]);
        setSelectedCourierId('');
        setSelectedCourier(null);
        setLogs([]);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setCurrentTab('dashboard');
        fetchCouriers(session.user.id);
      } else {
        setCurrentTab('quickCalc');
        setCouriers([]);
        setSelectedCourierId('');
        setSelectedCourier(null);
        setLogs([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch couriers list
  const fetchCouriers = async (userId) => {
    const uid = userId || session?.user?.id;
    if (!uid) return;

    try {
      let { data, error } = await supabase
        .from('couriers')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fallback: If no couriers exist yet, create a default one
      if (!data || data.length === 0) {
        const { data: newCourier, error: insertError } = await supabase
          .from('couriers')
          .insert([{ manager_id: uid, name: 'Benim Profilim' }])
          .select();

        if (insertError) throw insertError;
        data = newCourier || [];
      }

      setCouriers(data);
      
      // Select the first courier by default or keep existing selection
      if (data.length > 0) {
        const defaultId = data[0].id;
        setSelectedCourierId(prevId => {
          const exists = data.some(c => c.id === prevId);
          const nextId = exists ? prevId : defaultId;
          return nextId;
        });
      }
    } catch (error) {
      console.error('Error fetching couriers:', error.message);
    }
  };

  // Fetch logs for selected courier
  const fetchLogs = async (courierId) => {
    if (!courierId) return;

    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('courier_id', courierId)
        .order('log_date', { ascending: true });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error.message);
    }
  };

  // Effect to update selected courier object and fetch their logs
  useEffect(() => {
    if (selectedCourierId && couriers.length > 0) {
      const courier = couriers.find(c => c.id === selectedCourierId);
      if (courier) {
        setSelectedCourier(courier);
        fetchLogs(selectedCourierId);
      }
    }
  }, [selectedCourierId, couriers]);

  const handleRefreshData = () => {
    if (session?.user?.id) {
      fetchCouriers(session.user.id);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-muted)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite alternate' }}>🏍️</div>
        <div style={{ fontWeight: 600, letterSpacing: '1px', fontSize: '1rem' }}>MİGROS KURYE YÜKLENİYOR...</div>
      </div>
    );
  }

  // Render tab content depending on session status
  const renderTabContent = () => {
    if (!session) {
      switch (currentTab) {
        case 'quickCalc':
          return <QuickCalc />;
        case 'auth':
          return <Auth />;
        default:
          return <QuickCalc />;
      }
    } else {
      if (!selectedCourier) {
        return (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Lütfen bir kurye profili seçin veya oluşturun.
          </div>
        );
      }

      switch (currentTab) {
        case 'dashboard':
          return (
            <Dashboard 
              session={session} 
              selectedCourier={selectedCourier}
              logs={logs} 
              onRefreshLogs={handleRefreshData} 
            />
          );
        case 'calendar':
          return (
            <Calendar 
              session={session} 
              selectedCourier={selectedCourier}
              logs={logs} 
              onLogChange={handleRefreshData}
              hourlyRate={selectedCourier.hourly_rate}
            />
          );
        case 'settings':
          return (
            <Settings 
              session={session} 
              couriers={couriers}
              selectedCourier={selectedCourier}
              onRefreshCouriers={handleRefreshData}
              setSelectedCourierId={setSelectedCourierId}
            />
          );
        default:
          return (
            <Dashboard 
              session={session} 
              selectedCourier={selectedCourier}
              logs={logs} 
              onRefreshLogs={handleRefreshData} 
            />
          );
      }
    }
  };

  return (
    <Layout 
      currentTab={currentTab} 
      setCurrentTab={setCurrentTab} 
      session={session}
      couriers={couriers}
      selectedCourierId={selectedCourierId}
      onCourierChange={setSelectedCourierId}
    >
      {renderTabContent()}
    </Layout>
  );
}
