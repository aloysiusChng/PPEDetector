// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pg = require('pg');
const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new pg.Pool({
  connectionString: process.env.DB_CONNECTION_STRING || 'postgresql://postgres:edgeInf2009@ppedetector-rds-db.ci9owh7ddycl.us-east-1.rds.amazonaws.com/ppevision',
  ssl: {
    rejectUnauthorized: false
  }
});

// S3 bucket URL
const S3_BUCKET_URL = process.env.S3_BUCKET_URL || 'https://ppe-vision-image.s3.ap-southeast-1.amazonaws.com';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Helper function to build the S3 image URL
function buildImageUrl(imageHash) {
  if (!imageHash) return null;
  return `${S3_BUCKET_URL}/${imageHash}`;
}

// API endpoint to get incidents
app.get('/api/incidents', async (req, res) => {
  // At the start of your /api/incidents endpoint
  //console.log('Querying all records:');
  //const checkResult = await pool.query('SELECT id, flagged FROM public.event_log');
  //checkResult.rows.forEach(row => {
  //console.log(`ID: ${row.id}, Flagged: ${row.flagged}, Type: ${typeof row.flagged}`);
//});
  try {
    const result = await pool.query(
      'SELECT id, created_at, image_hash, flagged, device_name FROM public.event_log ORDER BY created_at DESC'
    );
    
    // Transform data to match your frontend expectations with Singapore time conversion
    const incidents = result.rows.map(row => {
      // Convert UTC time to Singapore time (UTC+8)
      const utcTime = new Date(row.created_at);
      const singaporeTime = new Date(utcTime.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours
      
      return {
        id: row.id.toString(),
        timestamp: singaporeTime.toISOString(), // Singapore time
        flag: row.flagged,
        image_url: buildImageUrl(row.image_hash)
      };
    });
    
    res.json(incidents);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// API endpoint for a specific incident
app.get('/api/incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, created_at, image_hash, flagged, device_name FROM public.event_log WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    const row = result.rows[0];
    
    // Convert UTC time to Singapore time
    const utcTime = new Date(row.created_at);
    const singaporeTime = new Date(utcTime.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours
    
    const incident = {
      id: row.id.toString(),
      timestamp: singaporeTime.toISOString(),
      flag: row.flagged,
      image_url: buildImageUrl(row.image_hash),
      device_name: row.device_name
    };
    
    res.json(incident);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

// API endpoint for summary statistics
app.get('/api/stats/summary', async (req, res) => {
  try {
    // Get basic counts
    const totalResult = await pool.query('SELECT COUNT(*) FROM public.event_log');
    const violationsResult = await pool.query('SELECT COUNT(*) FROM public.event_log WHERE flagged = true');
    
    // Debug: Log the actual values
    console.log('Total count:', totalResult.rows[0].count);
    console.log('Violations count:', violationsResult.rows[0].count);
    
    const totalIncidents = parseInt(totalResult.rows[0].count);
    const totalViolations = parseInt(violationsResult.rows[0].count);
    
    // Get today's violations - using Singapore date instead of UTC
    const singaporeDate = new Date(Date.now() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const todayResult = await pool.query(
      "SELECT COUNT(*) FROM public.event_log WHERE flagged = true AND DATE(created_at + INTERVAL '8 hours') = $1",
      [singaporeDate]
    );
    
    // Debug
    console.log('Singapore date:', singaporeDate);
    console.log('Today\'s violations:', todayResult.rows[0].count);
    
    const todayViolations = parseInt(todayResult.rows[0].count);
    
    // Calculate compliance rate
    const complianceRate = Math.round(((totalIncidents - totalViolations) / totalIncidents) * 100) || 0;
    
    // Get hourly distribution data
    const hourlyData = await getHourlyDistribution();
    
    // Get trend data for the last 7 days
    const trendData = await getTrendData(7);
    
    res.json({
      totalIncidents,
      totalViolations,
      todayViolations,
      complianceRate,
      hourlyData,
      trendData
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

// Helper function to get hourly distribution
async function getHourlyDistribution() {
  try {
    // Use Singapore time for hour calculations
    const result = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM (created_at + INTERVAL '8 hours')) as hour,
        COUNT(*) as total,
        SUM(CASE WHEN flagged = true THEN 1 ELSE 0 END) as violations
      FROM public.event_log
      GROUP BY EXTRACT(HOUR FROM (created_at + INTERVAL '8 hours'))
      ORDER BY hour
    `);
    
    // Fill in any missing hours
    const hourlyData = Array(24).fill().map((_, i) => ({
      hour: `${i}:00`,
      detections: 0,
      violations: 0,
      rate: 0
    }));
    
    result.rows.forEach(row => {
      const hour = parseInt(row.hour);
      const total = parseInt(row.total);
      const violations = parseInt(row.violations);
      
      hourlyData[hour] = {
        hour: `${hour}:00`,
        detections: total,
        violations: violations,
        rate: total > 0 ? Math.round((violations / total) * 100) : 0
      };
    });
    
    return hourlyData;
  } catch (error) {
    console.error('Error generating hourly data:', error);
    return [];
  }
}

// Helper function to get trend data for the last N days
async function getTrendData(days) {
  try {
    // Debug logging
    console.log('Generating trend data for last', days, 'days');
    
    // Use Singapore time for date calculations
    const result = await pool.query(`
      SELECT 
        DATE(created_at + INTERVAL '8 hours') as date,
        COUNT(*) as total,
        SUM(CASE WHEN flagged = true THEN 1 ELSE 0 END) as violations
      FROM public.event_log
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at + INTERVAL '8 hours')
      ORDER BY date
    `);
    
    console.log('Trend query results:', result.rows);
    
    // Generate all dates for the last N days
    const today = new Date();
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Create the trend data with zeros for missing dates
    const trendData = dates.map(date => ({
      date,
      count: 0
    }));
    
    // Fill in actual data
    result.rows.forEach(row => {
      const date = new Date(row.date).toISOString().split('T')[0];
      const index = trendData.findIndex(item => item.date === date);
      if (index !== -1) {
        trendData[index].count = parseInt(row.violations);
      }
    });
    
    return trendData;
  } catch (error) {
    console.error('Error generating trend data:', error);
    return [];
  }
}

// API endpoint to get data by device name
app.get('/api/devices', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        device_name,
        COUNT(*) as total,
        SUM(CASE WHEN flagged = true THEN 1 ELSE 0 END) as violations
      FROM public.event_log
      GROUP BY device_name
      ORDER BY device_name
    `);
    
    const devices = result.rows.map(row => ({
      name: row.device_name,
      total: parseInt(row.total),
      violations: parseInt(row.violations),
      compliance: Math.round(((parseInt(row.total) - parseInt(row.violations)) / parseInt(row.total)) * 100) || 0
    }));
    
    res.json(devices);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Failed to fetch device data' });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});