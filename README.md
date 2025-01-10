# Invoice Management Application

A full-stack MERN application for managing invoices with user authentication, campaign management, and invoice generation.

## Features

- User authentication with JWT and secure password hashing
- Campaign creation and management
- Invoice generation and tracking
- Profile management with PAN card verification
- Responsive Material-UI design
- Rate limiting and security headers
- Multi-stage Docker builds for optimized container sizes

## Prerequisites

- Node.js 18+
- MongoDB 7.0+
- npm or yarn

## Environment Setup

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/mern-app
JWT_SECRET=your_jwt_secret
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

## Installation & Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Start MongoDB:
```bash
# Make sure you have MongoDB installed and running
mongod --dbpath /path/to/your/data/directory
```

4. Start the backend server:
```bash
cd backend
npm start
```

5. Start the frontend application:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:5000

## Docker Support

The application includes Docker support with multi-stage builds for both frontend and backend:

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting for API endpoints
- Security headers implementation
- PAN card validation
- Input validation and sanitization

## API Endpoints

### Authentication
- POST /auth/register - Register a new user
- POST /auth/login - User login
- PUT /auth/change-password - Change password (authenticated)

### Campaigns
- GET /campaigns - List all campaigns
- POST /campaigns - Create a new campaign
- PUT /campaigns/:id - Update a campaign
- DELETE /campaigns/:id - Delete a campaign

### Invoices
- GET /invoices - List all invoices
- POST /invoices - Create a new invoice
- PUT /invoices/:id - Update an invoice
- DELETE /invoices/:id - Delete an invoice

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
