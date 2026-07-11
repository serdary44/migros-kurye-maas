import React, { useState, useEffect } from 'react';
import { supabase } from './supabase/supabaseClient.js';
import Layout from './components/Layout.jsx';
import QuickCalc from './components/QuickCalc.jsx';
import Auth from './components/Auth.jsx';
import Dashboard from './components/Dashboard.jsx';
import Calendar from './components/Calendar.jsx';
import Settings from './components/Settings.jsx';
import { DEFAULT_HOURLY_RATE } from './utils/constants.js';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('quickCalc');
  const [logs, setLogs] = useState([]);
  const [hourlyRate, setHourlyRate] = useState(DEFAULT_HOURLY_RATE);

  // Handle auth session state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setCurrentTab('dashboard');
        fetchLogs(session.user.id);
        fetchProfile(session.user.id);
      } else {
        setCurrentTab('quickCalc');
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
        fetchLogs(session.user.id);
        fetchProfile(session.user.id);
      } else {
        setCurrentTab('quickCalc');
        setLogs([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all user daily logs
  const fetchLogs = async (userId) => {
    const uid = userId || session?.user?.id;
    if (!uid) return;

    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', uid)
        .order('log_date', { ascending: true });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error.message);
    }
  };

  // Fetch hourly rate specifically for calendar drawing
  const fetchProfile = async (userId) => {
    const uid = userId || session?.user?.id;
    if (!uid) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('hourly_rate')
        .eq('id', uid)
        .single();

      if (error) throw error;
      if (data) {
        setHourlyRate(data.hourly_rate ?? DEFAULT_HOURLY_RATE);
      }
    } catch (error) {
      console.error('Error fetching profile settings:', error.message);
    }
  };

  const handleRefreshData = () => {
    if (session?.user?.id) {
      fetchLogs(session.user.id);
      fetchProfile(session.user.id);
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
      // Unauthenticated views
      switch (currentTab) {
        case 'quickCalc':
          return <QuickCalc />;
        case 'auth':
          return <Auth />;
        default:
          return <QuickCalc />;
      }
    } else {
      // Authenticated views
      switch (currentTab) {
        case 'dashboard':
          return (
            <Dashboard 
              session={session} 
              logs={logs} 
              onRefreshLogs={handleRefreshData} 
            />
          );
        case 'calendar':
          return (
            <Calendar 
              session={session} 
              logs={logs} 
              onLogChange={handleRefreshData}
              hourlyRate={hourlyRate}
            />
          );
        case 'settings':
          return (
            <Settings 
              session={session} 
            />
          );
        default:
          return (
            <Dashboard 
              session={session} 
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
    >
      {renderTabContent()}
    </Layout>
  );
}
