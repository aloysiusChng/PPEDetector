import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import IncidentDetails from './components/IncidentDetails';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import './App.css';
import { fetchIncidents, fetchSummaryStats } from './services/api';

function App() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({
    totalIncidents: 0,
    todayIncidents: 0,
    resolvedIncidents: 0,
    safetyScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAlerts, setNewAlerts] = useState(0);
  
  // Function to fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const incidentsData = await fetchIncidents();
      const statsData = await fetchSummaryStats();
      
      setIncidents(incidentsData);
      setStats(statsData);
      
      // Calculate new alerts (incidents from the last hour)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const recentAlerts = incidentsData.filter(incident => 
        new Date(incident.timestamp) > oneHourAgo
      ).length;
      
      setNewAlerts(recentAlerts);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      setLoading(false);
      console.error('Error fetching data:', err);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);
  
  // Set up polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 15000); // Poll every 15 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle error states
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchData}>Retry</button>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <Header newAlerts={newAlerts} />
          <div className="content-container">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    incidents={incidents} 
                    stats={stats} 
                    loading={loading}
                  />
                } 
              />
              <Route 
                path="/incidents/:id" 
                element={<IncidentDetails incidents={incidents} />} 
              />
              <Route 
                path="/analytics" 
                element={<Analytics incidents={incidents} />} 
              />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;