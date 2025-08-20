# User Management Feature

## Overview
The POS system now includes a comprehensive user management feature that allows administrators to create, edit, and manage user accounts. This feature is exclusively available in the Admin Panel.

## Features

### 🔐 Admin-Only Access
- User management is restricted to admin users only
- All user management operations require admin authentication
- Regular users (cashier, manager) cannot access user management features

### 👥 User Operations

#### Create New Users
- Add new users with username, email, password, and full name
- Assign roles: Admin, Manager, or Cashier
- Password validation (minimum 6 characters)
- Unique username and email validation

#### Edit Existing Users
- Update user information (username, email, full name, role)
- Toggle user active/inactive status
- Change user passwords
- Prevent admins from deactivating themselves

#### User Management
- View all users in a searchable list
- Filter users by username, email, full name, or role
- See user creation dates and last login times
- Role-based badges for easy identification

#### Security Features
- Password hashing with bcrypt (12 salt rounds)
- Prevent deletion of the last admin user
- Prevent admins from deactivating/deleting themselves
- Secure password change functionality

## User Interface

### Admin Panel Integration
The user management feature is integrated into the Admin Panel with:
- Dedicated "User Management" section
- Modern, responsive interface
- Search and filter capabilities
- Intuitive action buttons for each user

### User Actions
- ✏️ **Edit**: Modify user details and role
- 🔑 **Change Password**: Set new password for any user
- 👤 **Toggle Status**: Activate/deactivate user accounts
- 🗑️ **Delete**: Remove users (with safety checks)

## API Endpoints

### Authentication Required
All endpoints require admin authentication via JWT token.

### Available Endpoints

#### `GET /api/users`
Get all users in the system
- Returns: Array of user objects (without passwords)
- Sorted by role and username

#### `POST /api/users`
Create a new user
- Body: `{ username, email, password, full_name, role? }`
- Returns: Created user object

#### `PUT /api/users/:id`
Update an existing user
- Body: `{ username, email, full_name, role?, is_active? }`
- Returns: Updated user object

#### `DELETE /api/users/:id`
Delete a user
- Safety checks prevent deletion of self or last admin
- Returns: Success message

#### `POST /api/users/change-password`
Change a user's password
- Body: `{ userId, newPassword }`
- Returns: Success message

#### `PATCH /api/users/:id/toggle-status`
Toggle user active status
- Returns: Updated status

## Database Schema

The system uses the existing `users` table with the following structure:

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'cashier', -- admin, manager, cashier
    full_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Default Users

The system comes with pre-seeded users:

### Admin User
- **Username**: admin
- **Password**: admin123
- **Email**: admin@inlandcafe.com
- **Role**: Admin

### Cashier User
- **Username**: cashier
- **Password**: cashier123
- **Email**: cashier@inlandcafe.com
- **Role**: Cashier

## Security Considerations

### Password Security
- All passwords are hashed using bcrypt with 12 salt rounds
- Minimum password length of 6 characters
- Passwords are never stored or transmitted in plain text

### Access Control
- Only admin users can access user management features
- Users cannot modify their own critical settings (prevent lockout)
- Last admin user cannot be deleted (prevent system lockout)

### Audit Trail
- User creation and modification times are tracked
- Last login times are recorded
- All user management actions are logged to console

## Usage Instructions

### Accessing User Management
1. Log in as an admin user
2. Navigate to the Admin Panel
3. Click on "User Management" in the sidebar

### Creating a New User
1. Click the "Add User" button
2. Fill in the required information:
   - Username (unique)
   - Email (unique)
   - Password (minimum 6 characters)
   - Full Name
   - Role (Admin, Manager, or Cashier)
3. Click "Create User"

### Editing a User
1. Find the user in the list
2. Click the edit (✏️) button
3. Modify the desired fields
4. Click "Update User"

### Changing a User's Password
1. Find the user in the list
2. Click the key (🔑) button
3. Enter the new password
4. Click "Change Password"

### Deactivating/Activating a User
1. Find the user in the list
2. Click the user status button (👤)
3. Confirm the action

### Deleting a User
1. Find the user in the list
2. Click the delete (🗑️) button
3. Confirm the deletion
4. Note: You cannot delete yourself or the last admin

## Error Handling

The system includes comprehensive error handling for:
- Duplicate usernames or emails
- Invalid role assignments
- Insufficient permissions
- Self-modification restrictions
- Last admin protection
- Network and database errors

All errors are displayed with user-friendly messages and appropriate HTTP status codes.

## Future Enhancements

Potential future improvements:
- Bulk user operations
- User import/export functionality
- Advanced permission management
- User activity logs
- Password reset functionality
- Email notifications for user actions
