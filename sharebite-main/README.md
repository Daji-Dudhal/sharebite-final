# 🍽 Bite Sharing - Zero Food Waste Donation System

A comprehensive full-stack application to reduce food waste by connecting hotels/restaurants with NGOs, volunteers, needy people, and compost agencies.

## 🎯 Features

### Admin Panel
- User management (approve/reject registrations)
- Dashboard with analytics
- View all users, donations, and requests

### Hotel/Restaurant Panel
- Register and login
- Add food donations (Human/Dog/Compost)
- Upload food photos
- View donation history
- Gamification (points, badges, leaderboard)

### NGO Panel
- View nearby donations
- Accept pickup requests
- Assign volunteers
- Track distribution reports

### Volunteer Panel
- Accept pickup requests
- Live GPS tracking (WebSocket)
- Delivery route on Google Maps
- Upload distribution proof
- Earn points and badges

### Needy People Panel
- Request food directly
- Track volunteer delivery
- View request status

### Composting Agency Panel
- Get notifications for expired/stale food
- Accept pickup requests
- Mark items as composted
- Upload proof

## 🏗️ Tech Stack

### Backend
- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Data JPA**
- **Spring Security** (JWT Authentication)
- **Spring WebSocket** (Live tracking)
- **MySQL Database**
- **Maven**

### Frontend
- **React 18**
- **React Router DOM**
- **Axios** (HTTP client)
- **Google Maps API** (Location & Routing)
- **SockJS & STOMP** (WebSocket client)

## 📋 Prerequisites

- Java 17 or higher
- Maven 3.6+
- Node.js 16+ and npm
- MySQL 8.0+
- Google Maps API Key

## 🚀 Setup Instructions

### 1. Database Setup

1. Create MySQL database:
```sql
CREATE DATABASE bitesharing;
```

2. Update database credentials in `backend/src/main/resources/application.properties`:
```properties
spring.datasource.username=your_username
spring.datasource.password=your_password
```

3. The database schema will be auto-created by Hibernate on first run.

### 2. Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Build the project:
```bash
mvn clean install
```

3. Run the application:
```bash
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### 3. Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update Google Maps API key in:
   - `frontend/public/index.html` (line 11)
   - `frontend/src/components/Volunteer/VolunteerPanel.js` (line 123)

4. Start the development server:
```bash
npm start
```

The frontend will start on `http://localhost:3000`

### 4. Configuration

#### Backend Configuration (`backend/src/main/resources/application.properties`)

Update these values:
- `jwt.secret`: Your JWT secret key
- `google.maps.api.key`: Your Google Maps API key
- `sms.api.key`: Your SMS API key (optional)
- `sms.api.secret`: Your SMS API secret (optional)

#### Frontend Configuration

Update Google Maps API key in:
- `frontend/public/index.html`
- `frontend/src/components/Volunteer/VolunteerPanel.js`

## 🔐 Default Admin Credentials

After first run, you can login with:
- **Username**: `admin`
- **Password**: `admin123` (change this in production!)

## 📱 Usage

1. **Register**: Create an account based on your role (Hotel, NGO, Volunteer, etc.)
2. **Login**: Use your credentials to access your panel
3. **Admin Approval**: New users need admin approval before they can login
4. **Donate Food**: Hotels can add food donations
5. **Request Food**: NGOs, Needy, and Compost agencies can request donations
6. **Pickup & Deliver**: Volunteers can accept requests and track deliveries
7. **Earn Points**: Complete actions to earn points and badges

## 🗂️ Project Structure

```
biteSharing/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/bitesharing/
│   │   │   │   ├── model/          # JPA Entities
│   │   │   │   ├── repository/     # Spring Data JPA Repositories
│   │   │   │   ├── service/        # Business Logic
│   │   │   │   ├── controller/     # REST Controllers
│   │   │   │   ├── config/         # Configuration
│   │   │   │   ├── dto/            # Data Transfer Objects
│   │   │   │   └── util/           # Utilities
│   │   │   └── resources/
│   │   │       └── application.properties
│   └── pom.xml
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Admin/
│   │   │   ├── Hotel/
│   │   │   ├── NGO/
│   │   │   ├── Volunteer/
│   │   │   ├── Needy/
│   │   │   ├── Compost/
│   │   │   ├── Auth/
│   │   │   └── Common/
│   │   ├── context/
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `GET /api/users/pending` - Get pending users
- `PUT /api/users/{id}/status` - Update user status

### Donations
- `POST /api/donations` - Create donation
- `GET /api/donations` - Get all donations
- `GET /api/donations/{id}` - Get donation by ID
- `GET /api/donations/available/{type}` - Get available donations by type

### Requests
- `POST /api/requests` - Create request
- `GET /api/requests` - Get all requests
- `PUT /api/requests/{id}/assign` - Assign volunteer
- `PUT /api/requests/{id}/status` - Update request status

### Tracking
- `POST /api/tracking` - Update location
- `GET /api/tracking/request/{requestId}` - Get tracking history

### Gamification
- `GET /api/gamification/points/{userId}` - Get user points
- `GET /api/gamification/badges/{userId}` - Get user badges
- `GET /api/gamification/leaderboard` - Get leaderboard

## 🌐 WebSocket

WebSocket endpoint: `ws://localhost:8080/ws`

Subscribe to tracking updates:
- `/topic/tracking/{requestId}` - Real-time location updates

## 🎮 Gamification

Users earn points for:
- Creating donations: 10 points
- Completing deliveries: 15 points
- Composting items: 20 points
- Earning badges: 50 points

Badges are automatically awarded when users reach certain point thresholds.

## 🚧 Future Enhancements

- [ ] AI-based food freshness detection (OpenCV)
- [ ] SMS/Missed call integration for needy without smartphones
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Photo upload functionality
- [ ] Email notifications

## 📝 License

This project is created for educational purposes.

## 👥 Contributors

- Dhvanit

## 🙏 Acknowledgments

Built as a final-year project to address food waste and hunger issues.

---

**Note**: Remember to update all API keys and secrets before deploying to production!

