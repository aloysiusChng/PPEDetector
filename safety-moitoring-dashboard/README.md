# Workplace Safety Monitoring Dashboard

This project provides a comprehensive dashboard for monitoring workplace safety compliance through a camera system that detects PPE violations.

## Project Structure

```
safety-monitoring-dashboard/
├── frontend/               # React dashboard
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/
│   │   │   └── api.js      # API service for data fetching
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── backend/                # API server
│   ├── server.js           # Main server file
│   └── package.json
├── Dockerfile              # Docker configuration
├── .dockerignore           # Files to exclude from Docker
├── docker-compose.yml      # Docker Compose configuration
└── README.md               # This file
```

## Data Schema

The application works with the following data schema:
- `id`: Unique identifier for each detection
- `timestamp`: When the detection occurred
- `flag`: 0 for no violation, 1 for PPE violation
- `image_url`: S3 bucket URL to the captured image (NULL when flag=0)

## Deployment Instructions

### Prerequisites
- Amazon EC2 instance
- Docker and Docker Compose installed
- AWS credentials with access to DynamoDB and S3

### Deployment Steps

1. Upload this project to your EC2 instance:
   ```bash
   scp -i your-key.pem -r safety-monitoring-dashboard ec2-user@your-ec2-ip:/home/ec2-user/
   ```

2. SSH into your EC2 instance:
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-ip
   ```

3. Navigate to the project directory:
   ```bash
   cd safety-monitoring-dashboard
   ```

4. Update AWS credentials in `docker-compose.yml` with your credentials that have access to the DynamoDB table and S3 bucket.

5. Build and start the container:
   ```bash
   docker-compose up -d
   ```

6. Access the dashboard at your EC2 public DNS or IP:
   http://your-ec2-public-dns

### Installing Docker and Docker Compose on EC2 (Amazon Linux 2)

If Docker is not installed on your EC2 instance:

```bash
# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.15.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and log back in for group changes to take effect
exit
# Then reconnect to your instance
```

## Features

- **Real-time monitoring** of safety compliance
- **Time-based analytics** showing patterns in violations
- **Detailed visualization** of compliance data
- **Simple interface** for viewing violation details
- **Responsive design** for various screen sizes

## Troubleshooting

- View container logs: `docker-compose logs -f`
- Restart the service: `docker-compose restart`
- Check if port 80 is open in your EC2 security group
- Verify AWS credentials have proper permissions for DynamoDB and S3