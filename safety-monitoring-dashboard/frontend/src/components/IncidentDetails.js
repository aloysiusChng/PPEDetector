// src/components/IncidentDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertTriangle, Image } from 'lucide-react';
import { fetchIncidentById } from '../services/api';

const IncidentDetails = ({ incidents }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadIncident = async () => {
      try {
        setLoading(true);
        
        // Try to find the incident in the prop first
        const foundIncident = incidents.find(inc => inc.id === id);
        
        if (foundIncident) {
          setIncident(foundIncident);
        } else {
          // If not found in props, fetch from API
          const data = await fetchIncidentById(id);
          setIncident(data);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load incident details.');
        setLoading(false);
        console.error('Error loading incident:', err);
      }
    };
    
    loadIncident();
  }, [id, incidents]);
  
  if (loading) {
    return <div className="loading-container">Loading incident details...</div>;
  }
  
  if (error || !incident) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || 'Incident not found'}</p>
        <button onClick={() => navigate('/')}>Back to Dashboard</button>
      </div>
    );
  }
  
  return (
    <div className="incident-details">
      <div className="details-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <h2>Incident {incident.id}</h2>
        <span className={`status ${incident.flag === true ? 'active' : 'resolved'}`}>
          {incident.flag === true ? 'Violation' : 'No Violation'}
        </span>
      </div>
      
      <div className="details-content">
        <div className="details-main">
          <div className="incident-image">
            {incident.image_url ? (
              <img src={incident.image_url} alt={`Safety incident ${incident.id}`} />
            ) : (
              <div className="no-image">
                <Image size={48} />
                <p>No image available</p>
              </div>
            )}
          </div>
          
          <div className="incident-info">
            <div className="info-card">
              <div className="info-item">
                <Clock size={20} />
                <div>
                  <span className="label">Timestamp</span>
                  <span className="value">{new Date(incident.timestamp).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="info-item">
                <AlertTriangle size={20} />
                <div>
                  <span className="label">Status</span>
                  <span className={`value severity ${incident.flag === true ? 'high' : 'low'}`}>
                    {incident.flag === true ? 'Safety Violation' : 'No Violation'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="incident-metadata">
              <h3>Additional Information</h3>
              <div className="metadata-item">
                <span className="label">ID:</span>
                <span className="value">{incident.id}</span>
              </div>
              <div className="metadata-item">
                <span className="label">Date:</span>
                <span className="value">{new Date(incident.timestamp).toLocaleDateString()}</span>
              </div>
              <div className="metadata-item">
                <span className="label">Time:</span>
                <span className="value">{new Date(incident.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="metadata-item">
                <span className="label">Location:</span>
                <span className="value">Main Entrance</span>
              </div>
              {incident.image_url && (
                <div className="metadata-item">
                  <span className="label">Image URL:</span>
                  <span className="value image-url">{incident.image_url}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetails;