# Quick Setup Guide

## Prerequisites Check

1. **Java 17+**: Run `java -version`
2. **Maven**: Run `mvn -version`
3. **Node.js**: Run `node -version`
4. **MySQL**: Run `mysql --version`

## Step-by-Step Setup

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE bitesharing;

# Exit MySQL
exit;
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Update application.properties with your MySQL credentials
# Edit: src/main/resources/application.properties
# Change: spring.datasource.username=root
# Change: spring.datasource.password=your_password

# Build and run
mvn clean install
mvn spring-boot:run
```

Backend will run on: `http://localhost:8080`

### 3. Frontend Setup

```bash
# Open a new terminal
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# IMPORTANT: Update Google Maps API Key
# 1. Get API key from: https://console.cloud.google.com/
# 2. Edit: public/index.html (line 11)
# 3. Edit: src/components/Volunteer/VolunteerPanel.js (line 123)
# Replace: YOUR_GOOGLE_MAPS_API_KEY

# Start frontend
npm start
```

Frontend will run on: `http://localhost:3000`

## First Login

1. Open browser: `http://localhost:3000`
2. Login with:
   - Username: `admin`
   - Password: `admin123`

## Testing the Application

1. **Register a Hotel User**:
   - Go to Register page
   - Select "Hotel/Restaurant"
   - Fill in details and register
   - Wait for admin approval

2. **Approve User (as Admin)**:
   - Login as admin
   - Go to "Pending User Approvals"
   - Click "Approve" for the hotel user

3. **Create Donation (as Hotel)**:
   - Login as hotel user
   - Click "Add New Donation"
   - Fill in food details
   - Submit

4. **Request Donation (as NGO/Needy)**:
   - Register and login as NGO or Needy
   - View available donations
   - Click "Request"

5. **Accept Request (as Volunteer)**:
   - Register and login as Volunteer
   - View available pickup requests
   - Click "Accept"
   - Click "Track" to see live location

## Troubleshooting

### Backend won't start
- Check MySQL is running: `mysql -u root -p`
- Check database exists: `SHOW DATABASES;`
- Check port 8080 is free

### Frontend won't start
- Delete `node_modules` and run `npm install` again
- Check port 3000 is free
- Check Node.js version (16+)

### Database connection error
- Verify MySQL credentials in `application.properties`
- Check MySQL service is running
- Try: `mysql -u root -p` to test connection

### Google Maps not working
- Verify API key is correct
- Check API key has Maps JavaScript API enabled
- Check billing is enabled in Google Cloud Console

## Default Credentials

- **Admin**: admin / admin123
- **Change password in production!**

## Next Steps

1. Update JWT secret in `application.properties`
2. Add SMS API credentials (optional)
3. Configure file upload directory
4. Set up production database
5. Deploy to cloud (AWS, Azure, etc.)

