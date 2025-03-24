// src/services/api.js
import axios from 'axios';

// Use relative path for API - this will work when deployed on EC2
const API_BASE_URL = '/api';

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
    
    // For development and testing - remove in production
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
    
    // For development and testing - remove in production
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
    
    // For development and testing - remove in production
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
    date.setDate(date.getDate() - Math.floor(Math.random() * 14)); // Last 2 weeks
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));
    
    const flag = Math.random() > 0.3 ? 1 : 0; // 70% violation, 30% no violation
    
    return {
      id: `INC-${1000 + i}`,
      timestamp: date.toISOString(),
      flag: flag,
      image_url: flag ? `https://via.placeholder.com/300x200?text=Safety+Violation+${i+1}` : null
    };
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first
};

// Generate mock statistics based on mock incidents
const generateMockStats = () => {
  const incidents = generateMockIncidents();
  
  // Count total incidents and violations
  const totalIncidents = incidents.length;
  const violations = incidents.filter(inc => inc.flag === 1);
  const totalViolations = violations.length;
  
  // Calculate today's violations
  const today = new Date().toISOString().split('T')[0];
  const todayViolations = violations.filter(
    inc => inc.timestamp.startsWith(today)
  ).length;
  
  // Calculate compliance rate
  const complianceRate = Math.round(((totalIncidents - totalViolations) / totalIncidents) * 100);
  
  // Calculate weekly trend data
  const trendData = generateTrendData(7);
  
  // Calculate hourly distribution
  const hourlyData = generateHourlyData(incidents);
  
  return {
    totalIncidents,
    totalViolations,
    todayViolations,
    complianceRate,
    trendData,
    hourlyData
  };
};

// Helper to generate trend data
const generateTrendData = (days) => {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    data.push({
      date: dateStr,
      count: Math.floor(Math.random() * 10)
    });
  }
  
  return data;
};

// Helper to generate hourly distribution data
const generateHourlyData = (incidents) => {
  const hourCounts = Array(24).fill(0);
  const violationCounts = Array(24).fill(0);
  
  incidents.forEach(incident => {
    const hour = new Date(incident.timestamp).getHours();
    hourCounts[hour]++;
    if (incident.flag === 1) {
      violationCounts[hour]++;
    }
  });
  
  return Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}:00`,
    detections: hourCounts[hour],
    violations: violationCounts[hour],
    rate: hourCounts[hour] ? Math.round((violationCounts[hour] / hourCounts[hour]) * 100) : 0
  }));
};

export default {
  fetchIncidents,
  fetchSummaryStats,
  fetchIncidentById
};