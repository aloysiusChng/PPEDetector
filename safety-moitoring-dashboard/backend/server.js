// backend/server.js
const express = require('express');
const path = require('path');
const AWS = require('aws-sdk');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, '../frontend/build')));

// API Routes
app.get('/api/incidents', async (req, res) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE || 'safety_incidents'
    };
    
    const result = await dynamoDB.scan(params).promise();
    res.json(result.Items);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

app.get('/api/incidents/:id', async (req, res) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE || 'safety_incidents',
      Key: {
        id: req.params.id
      }
    };
    
    const result = await dynamoDB.get(params).promise();
    
    if (!result.Item) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    res.json(result.Item);
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

app.get('/api/stats/summary', async (req, res) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE || 'safety_incidents'
    };
    
    const result = await dynamoDB.scan(params).promise();
    const incidents = result.Items;
    
    // Calculate statistics
    const totalIncidents = incidents.length;
    const violations = incidents.filter(inc => inc.flag === 1);
    const totalViolations = violations.length;
    
    // Calculate today's violations
    const today = new Date().toISOString().split('T')[0];
    const todayViolations = violations.filter(
      inc => inc.timestamp.startsWith(today)
    ).length;
    
    // Calculate compliance rate
    const complianceRate = Math.round(((totalIncidents - totalViolations) / totalIncidents) * 100) || 0;
    
    // Process hourly distribution
    const hourlyData = processHourlyData(incidents);
    
    // Generate trend data (last 7 days)
    const trendData = processTrendData(incidents, 7);
    
    res.json({
      totalIncidents,
      totalViolations,
      todayViolations,
      complianceRate,
      hourlyData,
      trendData
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ error: 'Failed to calculate stats' });
  }
});

// Helper function to process hourly data
function processHourlyData(incidents) {
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
}

// Helper function to process trend data
function processTrendData(incidents, days) {
  const result = [];
  const today = new Date();
  
  // Create empty data for each day
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    result.push({
      date: dateStr,
      count: 0
    });
  }
  
  // Fill with actual violation data
  incidents.forEach(incident => {
    if (incident.flag === 1) {
      const dateStr = incident.timestamp.split('T')[0];
      const dayData = result.find(d => d.date === dateStr);
      
      if (dayData) {
        dayData.count++;
      }
    }
  });
  
  return result;
}

// Serve frontend for all other routes in production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});