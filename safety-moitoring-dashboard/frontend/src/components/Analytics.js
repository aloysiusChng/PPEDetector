// src/components/Analytics.js
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Calendar, Download, Clock } from 'lucide-react';
import './Analytics.css';

const Analytics = ({ incidents }) => {
  const [timeRange, setTimeRange] = useState('week');
  const [hourlyData, setHourlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [complianceRate, setComplianceRate] = useState(0);
  
  useEffect(() => {
    // Process data when incidents change
    if (incidents && incidents.length > 0) {
      // Process hourly distribution
      const hourlyStats = processHourlyData(incidents);
      setHourlyData(hourlyStats);
      
      // Process daily trend
      const dailyStats = processDailyData(incidents, timeRange);
      setDailyData(dailyStats);
      
      // Calculate compliance rate
      const violations = incidents.filter(inc => inc.flag === 1).length;
      const rate = Math.round(((incidents.length - violations) / incidents.length) * 100);
      setComplianceRate(rate);
    }
  }, [incidents, timeRange]);
  
  // Process data by hour
  const processHourlyData = (data) => {
    const hourCounts = Array(24).fill(0);
    const violationCounts = Array(24).fill(0);
    
    data.forEach(incident => {
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
  
  // Process data by day
  const processDailyData = (data, range) => {
    const days = range === 'week' ? 7 : (range === 'month' ? 30 : 90);
    const result = [];
    
    // Create date buckets
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      result.push({
        date: dateStr,
        detections: 0,
        violations: 0,
        rate: 0
      });
    }
    
    // Fill with actual data
    data.forEach(incident => {
      const dateStr = incident.timestamp.split('T')[0];
      const dayData = result.find(d => d.date === dateStr);
      
      if (dayData) {
        dayData.detections++;
        if (incident.flag === 1) {
          dayData.violations++;
        }
      }
    });
    
    // Calculate rates
    result.forEach(day => {
      day.rate = day.detections ? Math.round((day.violations / day.detections) * 100) : 0;
    });
    
    return result;
  };
  
  // Get day of week distribution
  const processDayOfWeekData = (data) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = Array(7).fill(0);
    const violationCounts = Array(7).fill(0);
    
    data.forEach(incident => {
      const dayIndex = new Date(incident.timestamp).getDay();
      dayCounts[dayIndex]++;
      if (incident.flag === 1) {
        violationCounts[dayIndex]++;
      }
    });
    
    return days.map((day, index) => ({
      day,
      detections: dayCounts[index],
      violations: violationCounts[index],
      rate: dayCounts[index] ? Math.round((violationCounts[index] / dayCounts[index]) * 100) : 0
    }));
  };
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  // Only show violations (flag=1)
  const violations = incidents.filter(incident => incident.flag === 1);
  
  return (
    <div className="analytics">
      <div className="analytics-header">
        <h1>Safety Analytics</h1>
        <div className="actions">
          <div className="time-selector">
            <Calendar size={16} />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
            </select>
          </div>
          <button className="export-btn">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>
      
      <div className="compliance-summary">
        <div className="compliance-card">
          <h3>Overall Compliance Rate</h3>
          <div className="compliance-value">
            <div className="circular-progress" style={{
              background: `conic-gradient(#4CAF50 ${complianceRate * 3.6}deg, #f3f3f3 0deg)`
            }}>
              <div className="inner-circle">
                <span>{complianceRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="analytics-grid">
        {/* Daily Trend Chart */}
        <div className="chart-container">
          <h3>Detection Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name === 'rate' ? 'Violation Rate (%)' : name]}
                labelFormatter={(label) => {
                  const d = new Date(label);
                  return d.toLocaleDateString();
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="detections" 
                stroke="#3182CE" 
                strokeWidth={2}
                name="Total Detections"
              />
              <Line 
                type="monotone" 
                dataKey="violations" 
                stroke="#F56565" 
                strokeWidth={2}
                name="Violations"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Hourly Distribution Chart */}
        <div className="chart-container">
          <h3>Detections by Hour of Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="detections" name="Total Detections" fill="#3182CE" />
              <Bar dataKey="violations" name="Violations" fill="#F56565" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Day of Week Chart */}
        <div className="chart-container">
          <h3>Detections by Day of Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processDayOfWeekData(incidents)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="detections" name="Total Detections" fill="#3182CE" />
              <Bar dataKey="violations" name="Violations" fill="#F56565" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Violation Rate by Hour */}
        <div className="chart-container">
          <h3>Violation Rate by Hour (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Violation Rate']} />
              <Bar dataKey="rate" fill="#8884D8" name="Violation Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Detailed Incidents Table */}
      <div className="incidents-table-section">
        <h3>Violation Log</h3>
        <table className="incidents-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>ID</th>
              <th>Image</th>
            </tr>
          </thead>
          <tbody>
            {violations.map(incident => (
              <tr key={incident.id}>
                <td>{new Date(incident.timestamp).toLocaleString()}</td>
                <td>{incident.id}</td>
                <td>
                  {incident.image_url ? (
                    <a href={incident.image_url} target="_blank" rel="noopener noreferrer">
                      View Image
                    </a>
                  ) : (
                    'No Image'
                  )}
                </td>
              </tr>
            ))}
            {violations.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center">No violations found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;