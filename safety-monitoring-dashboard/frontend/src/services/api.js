// src/services/api.js
import axios from 'axios';

// Use relative path for API
const API_BASE_URL = 'http://localhost:3000/api';

// Configure axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch all safety incidents
export const fetchIncidents = async () => {
  try {
    const response = await apiClient.get('/incidents');
    return response.data;
  } catch (error) {
    console.error('Error fetching incidents:', error);
    
    // For development and testing only - remove in production
    if (process.env.NODE_ENV === 'development') {
      return generateMockIncidents();
    }
    
    throw error;
  }
};

// Fetch summary statistics
export const fetchSummaryStats = async () => {
  try {
    const response = await apiClient.get('/stats/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    
    // For development and testing only - remove in production
    if (process.env.NODE_ENV === 'development') {
      return generateMockStats();
    }
    
    throw error;
  }
};

// Fetch specific incident details by ID
export const fetchIncidentById = async (id) => {
  try {
    const response = await apiClient.get(`/incidents/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching incident ${id}:`, error);
    
    // For development and testing only - remove in production
    if (process.env.NODE_ENV === 'development') {
      const mockIncidents = generateMockIncidents();
      return mockIncidents.find(incident => incident.id === id) || null;
    }
    
    throw error;
  }
};

// Mock data generators for development
const generateMockIncidents = () => {
  return Array.from({ length: 50 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 14));
    date.setHours(Math.floor(Math.random() * 24));
    
    const flag = Math.random() > 0.3;
    
    return {
      id: `INC-${1000 + i}`,
      timestamp: date.toISOString(),
      flag: flag,
      image_url: flag ? `https://ppe-vision-image.s3.ap-southeast-1.amazonaws.com/sample-${i % 5 + 1}` : null
    };
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

// Generate mock statistics based on mock incidents
const generateMockStats = () => {
  const incidents = generateMockIncidents();
  
  // Count total incidents and violations
  const totalIncidents = incidents.length;
  const violations = incidents.filter(inc => inc.flag);
  const totalViolations = violations.length;
  
  // Calculate today's violations
  const today = new Date().toISOString().split('T')[0];
  const todayViolations = violations.filter(
    inc => inc.timestamp.startsWith(today)
  ).length;
  
  // Calculate compliance rate
  const complianceRate = Math.round(((totalIncidents - totalViolations) / totalIncidents) * 100);
  
  return {
    totalIncidents,
    totalViolations,
    todayViolations,
    complianceRate,
    trendData: Array(7).fill().map((_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      count: Math.floor(Math.random() * 10)
    })).reverse(),
    hourlyData: Array(24).fill().map((_, i) => ({
      hour: `${i}:00`,
      detections: Math.floor(Math.random() * 20),
      violations: Math.floor(Math.random() * 10),
      rate: Math.floor(Math.random() * 50)
    }))
  };
};

export default {
  fetchIncidents,
  fetchSummaryStats,
  fetchIncidentById
};