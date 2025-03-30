# Workplace Safety Monitoring Dashboard

This document explains how to set up and run the Workplace Safety Monitoring dashboard application.

## Prerequisites

- Node.js (v14 or newer)
- npm (usually comes with Node.js)
- Access to the RDS database and S3 bucket credentials

## Project Structure

This project consists of two main parts:

- Frontend: React dashboard that displays the safety monitoring data
- Backend: Express server that connects to PostgreSQL and serves the React app

## Setup Steps

### 1. Extract the Zip File

- Extract the provided ZIP file to a directory of your choice.

### 2. Install Dependencies

- Open a terminal/command prompt and navigate to the project directory:

```bash
  # Install backend dependencies
   cd safety-monitoring-dashboard/backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
```

## Configure Environment Variables

- Create a .env file in the backend directory with the following content:

```bash
   DB_CONNECTION_STRING="u need to be in our super exclusive secret telegram group to find out"
   S3_BUCKET_URL=https://ppe-vision-image.s3.ap-southeast-1.amazonaws.com
```

## Build the Frontend

```bash
   cd ../frontend
   npm run build
```
## Start the Server

```bash
   cd ../backend
   node server.js
```

- You should see a message: "Server running on port 3000"
- Open a web browser and navigate to:
```bash
   http://localhost:3000
```

## For EC2 Deployment (Optional)

- Upload the entire project to an EC2 instance
- Install Node.js and npm on the instance
- Follow the setup steps above
- Configure security groups to allow inbound traffic on port 3000
- Access the dashboard using the EC2 public DNS or IP

## Using Docker (Optional)

- If Docker is available, you can use the included Dockerfile and docker-compose.yml:
```bash
   docker-compose up
```
