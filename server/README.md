# Zeply Backend Server

Backend API server for the Zeply marketing agency platform.

## Features

- **Authentication System**: JWT-based authentication with role-based access control
- **User Management**: Admin and client user management
- **Admin Dashboard**: Manage users, view stats, control access
- **Client Portal**: Clients can view their deliverables and submit for review
- **Deliverables Management**: Track and manage all client deliverables
- **Notes & Comments**: Add notes to deliverables for communication

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zeply
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

3. Make sure MongoDB is running on your system.

4. Create your admin account:
```bash
node scripts/createAdmin.js your-email@example.com your-password "Your Name"
```

5. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (public)
- `POST /api/auth/login` - Login user (public)
- `GET /api/auth/me` - Get current user (private)

### Admin Routes (Admin only)
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get single user
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### Deliverables (Authenticated)
- `GET /api/deliverables` - Get all deliverables (filtered by role)
- `GET /api/deliverables/:id` - Get single deliverable
- `POST /api/deliverables` - Create deliverable (admin only)
- `PUT /api/deliverables/:id` - Update deliverable
- `DELETE /api/deliverables/:id` - Delete deliverable (admin only)
- `POST /api/deliverables/:id/notes` - Add note to deliverable

## User Roles

- **Admin**: Full access to manage users, create deliverables, view all data
- **Client**: Can view their own deliverables, submit for review, add notes

## Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Example API Calls

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'
```

### Get All Users (Admin)
```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer <your-token>"
```

### Create Deliverable (Admin)
```bash
curl -X POST http://localhost:5000/api/deliverables \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Website Redesign",
    "description": "Complete website redesign project",
    "type": "design",
    "client": "<client-user-id>",
    "dueDate": "2024-12-31"
  }'
```

