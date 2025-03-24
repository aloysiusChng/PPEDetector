// src/components/Settings.js
import React, { useState } from 'react';

const Settings = () => {
  const [displaySettings, setDisplaySettings] = useState({
    refreshInterval: 15,
    darkMode: false,
    timeFormat: '24h',
    dateFormat: 'MM/DD/YYYY',
    chartColors: 'default',
    showGridLines: true
  });
  
  const handleDisplayChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDisplaySettings({
      ...displaySettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSave = () => {
    // Here you would save the settings to localStorage or similar
    // For now we just show a success message
    alert('Settings saved successfully!');
  };
  
  return (
    <div className="settings">
      <h1>Dashboard Settings</h1>
      
      {/* Display Settings */}
      <div className="settings-card">
        <h2>Display Settings</h2>
        
        <div className="settings-group">
          <div className="form-group">
            <label htmlFor="refreshInterval">Data Refresh Interval (seconds)</label>
            <input
              type="number"
              id="refreshInterval"
              name="refreshInterval"
              value={displaySettings.refreshInterval}
              onChange={handleDisplayChange}
              min="5"
              max="300"
            />
          </div>
          
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="darkMode"
              name="darkMode"
              checked={displaySettings.darkMode}
              onChange={handleDisplayChange}
            />
            <label htmlFor="darkMode">Enable Dark Mode</label>
          </div>
          
          <div className="form-group">
            <label htmlFor="timeFormat">Time Format</label>
            <select
              id="timeFormat"
              name="timeFormat"
              value={displaySettings.timeFormat}
              onChange={handleDisplayChange}
            >
              <option value="12h">12-hour (AM/PM)</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="dateFormat">Date Format</label>
            <select
              id="dateFormat"
              name="dateFormat"
              value={displaySettings.dateFormat}
              onChange={handleDisplayChange}
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="chartColors">Chart Color Scheme</label>
            <select
              id="chartColors"
              name="chartColors"
              value={displaySettings.chartColors}
              onChange={handleDisplayChange}
            >
              <option value="default">Default</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="monochrome">Monochrome</option>
            </select>
          </div>
          
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="showGridLines"
              name="showGridLines"
              checked={displaySettings.showGridLines}
              onChange={handleDisplayChange}
            />
            <label htmlFor="showGridLines">Show Grid Lines on Charts</label>
          </div>
        </div>
      </div>
      
      {/* System Information */}
      <div className="settings-card">
        <h2>System Information</h2>
        
        <div className="info-list">
          <div className="info-item">
            <span className="info-label">Dashboard Version:</span>
            <span className="info-value">1.0.0</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">API Status:</span>
            <span className="info-value status-ok">Connected</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Camera Status:</span>
            <span className="info-value status-ok">Active</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Ultrasonic Sensor:</span>
            <span className="info-value status-ok">Active</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Last Data Update:</span>
            <span className="info-value">{new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div className="action-buttons">
        <button className="cancel-btn">Cancel</button>
        <button className="save-btn" onClick={handleSave}>Save Settings</button>
      </div>
    </div>
  );
};

export default Settings;