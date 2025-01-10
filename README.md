# Invoice Management Application

A full-stack MERN application for managing invoices with user authentication, PDF generation, and automatic status updates.

## Features

- User authentication with JWT
- Invoice creation and management
- Automatic status updates based on due dates
- PDF invoice generation
- Profile management
- Responsive Material-UI design

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB
- Docker and Docker Compose

### Environment Variables

Create `.env` files in both frontend and backend directories:

Backend `.env`:
```
MONGODB_URI=mongodb://localhost:27017/invoice-app
JWT_SECRET=your_jwt_secret
PORT=5002
```

Frontend `.env`:
```
REACT_APP_API_URL=http://localhost:5002
PORT=3003
```

### Running Locally

1. Start MongoDB:
```bash
mongod
```

2. Install dependencies and start backend:
```bash
cd backend
npm install
npm start
```

3. Install dependencies and start frontend:
```bash
cd frontend
npm install
npm start
```

### Running with Docker Compose

```bash
docker-compose up --build
```

## AWS Deployment

### Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. GitHub repository with the code
4. GitHub Actions secrets configured

### Required AWS Resources

1. **ECR Repositories:**
   ```bash
   aws ecr create-repository --repository-name invoice-app-frontend
   aws ecr create-repository --repository-name invoice-app-backend
   ```

2. **ECS Cluster:**
   ```bash
   aws ecs create-cluster --cluster-name invoice-app-cluster
   ```

3. **EFS for MongoDB persistence:**
   ```bash
   aws efs create-file-system --performance-mode generalPurpose --throughput-mode bursting
   ```

4. **Parameter Store for secrets:**
   ```bash
   aws ssm put-parameter --name "/invoice-app/jwt-secret" --value "your-secret" --type SecureString
   ```

### GitHub Actions Setup

Configure these secrets in your GitHub repository:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### Infrastructure Setup

1. Create VPC with public and private subnets
2. Create ECS Cluster
3. Create Application Load Balancer
4. Create ECS Service with Fargate launch type
5. Create EFS volume for MongoDB persistence
6. Set up security groups

### Deployment Process

1. Push to main branch triggers GitHub Actions workflow
2. Workflow builds and pushes Docker images to ECR
3. Updates ECS task definition with new image tags
4. Deploys updated task definition to ECS service

### Monitoring

1. Set up CloudWatch for logs and metrics
2. Create CloudWatch alarms for:
   - CPU/Memory utilization
   - Error rates
   - Response times

### Backup

1. Set up automated MongoDB backups using AWS Backup
2. Configure backup retention policies

## Security Considerations

1. Use AWS WAF for web application firewall
2. Enable AWS Shield for DDoS protection
3. Use AWS Secrets Manager for sensitive data
4. Implement proper VPC security groups
5. Use HTTPS only with AWS Certificate Manager

## Scaling

The application is designed to scale horizontally:
- ECS service auto-scaling based on CPU/Memory
- MongoDB can be migrated to MongoDB Atlas for better scaling
- CloudFront for static content delivery

## Maintenance

1. Regular updates:
   ```bash
   npm audit fix
   npm update
   ```

2. Database maintenance:
   ```bash
   mongodump --out /backup/$(date +%Y%m%d)
   ```

3. Log rotation and cleanup

## Troubleshooting

1. Check ECS service events:
   ```bash
   aws ecs describe-services --cluster invoice-app-cluster --services invoice-app-service
   ```

2. View container logs:
   ```bash
   aws logs get-log-events --log-group-name /ecs/invoice-app --log-stream-name container/backend/latest
   ```

3. Common issues:
   - MongoDB connection issues: Check security groups
   - Container health checks failing: Check logs
   - Deployment failures: Check task definition compatibility
