// src/components/Dashboard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AlertTriangle, CheckCircle, Calendar, Users, ArrowRight } from 'lucide-react';

const Dashboard = ({ incidents, stats, loading }) => {
  const [timeRange, setTimeRange] = useState('week');

  if (loading) {
    return <div className="loading-container">Loading dashboard data...</div>;
  }

  // Filter for violations (flag=1)
  const violations = incidents.filter(incident => incident.flag === true);

  // Calculate violation rate
  const violationRate = incidents.length > 0
    ? Math.round((violations.length / incidents.length) * 100)
    : 0;

  // Get today's violations with Singapore timezone adjustment
  const getSingaporeDate = () => {
    const now = new Date();
    // Add 8 hours for Singapore time zone (UTC+8)
    const sgTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    return sgTime.toISOString().split('T')[0];
  };

  const todaySGT = getSingaporeDate();
  const todayViolations = violations.filter(
    incident => {
      // Convert incident timestamp to Singapore time
      const incidentTime = new Date(incident.timestamp);
      const incidentSGTime = new Date(incidentTime.getTime() + (8 * 60 * 60 * 1000));
      const incidentDateSGT = incidentSGTime.toISOString().split('T')[0];
      return incidentDateSGT === todaySGT;
    }
  ).length;

  return (
    <div className="dashboard">
      <h1>Safety Monitoring Dashboard</h1>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <div className="card-icon today">
            <Users size={24} />
          </div>
          <div className="card-content">
            <h3>Total Detections</h3>
            <div className="card-value">{incidents.length}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-icon alert">
            <AlertTriangle size={24} />
          </div>
          <div className="card-content">
            <h3>Safety Violations</h3>
            <div className="card-value">{violations.length}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-icon today">
            <Calendar size={24} />
          </div>
          <div className="card-content">
            <h3>Today's Violations</h3>
            <div className="card-value">{todayViolations}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-icon score">
            <CheckCircle size={24} />
          </div>
          <div className="card-content">
            <h3>Compliance Rate</h3>
            <div className="card-value">{100 - violationRate}<span className="percent">%</span></div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-container">
        {/* Incident Trend Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Violation Trend</h3>
            <div className="chart-controls">
              <button
                className={timeRange === 'week' ? 'active' : ''}
                onClick={() => setTimeRange('week')}
              >
                Week
              </button>
              <button
                className={timeRange === 'month' ? 'active' : ''}
                onClick={() => setTimeRange('month')}
              >
                Month
              </button>
            </div>
          </div>
          <div className="chart">

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.trendData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(dateStr) => {
                    // Do not add timezone offset again
                    const dateObj = new Date(dateStr);
                    return `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} violations`, 'Count']}
                  labelFormatter={(dateStr) => {
                    // Do not add timezone offset again
                    const dateObj = new Date(dateStr);
                    return dateObj.toLocaleDateString();
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#F56565"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>

          </div>
        </div>

        {/* Hourly Distribution Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Activity by Hour of Day (All Time)</h3>
            <p className="chart-subtitle">Distribution of all detections by hour</p>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.hourlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="detections" name="Total Detections" fill="#3182CE" />
                <Bar dataKey="violations" name="Violations" fill="#F56565" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Violations */}
      <div className="recent-incidents">
        <div className="section-header">
          <h3>Recent Violations</h3>
          <Link to="/analytics" className="view-all">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="incidents-table">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {violations.slice(0, 5).map(incident => (
                <tr key={incident.id}>
                  <td>{new Date(incident.timestamp).toLocaleString()}</td>
                  <td>
                    <span className="status active">
                      Safety Violation
                    </span>
                  </td>
                  <td>
                    <Link to={`/incidents/${incident.id}`} className="view-details">
                      View Details
                    </Link>
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
    </div>
  );
};

export default Dashboard;
