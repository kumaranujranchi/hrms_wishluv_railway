# Wishluv HRMS - Human Resource Management System

A comprehensive Human Resource Management System built with modern web technologies, featuring attendance tracking with geo-fencing, leave management, payroll processing, and employee onboarding.

## 🚀 Features

### Core HR Functionalities
- **Attendance Management**: Real-time check-in/check-out with GPS tracking and geo-fencing
- **Leave Management**: Comprehensive leave request system with approval workflows
- **Payroll Processing**: Automated salary calculations with detailed breakdowns
- **Employee Onboarding**: Complete employee profile management and onboarding workflow
- **Expense Claims**: Receipt upload and approval system
- **Company Announcements**: Internal communication system

### Advanced Features
- **Geo-location Tracking**: Location-based attendance with reverse geocoding
- **Role-based Access Control**: Admin, Manager, and Employee roles
- **Mobile-first Design**: Responsive interface optimized for mobile devices
- **Real-time Updates**: Live data synchronization across all users
- **File Upload System**: Secure document and receipt management

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive styling
- **Radix UI** + **shadcn/ui** for accessible components
- **TanStack Query** for server state management
- **Framer Motion** for smooth animations
- **Wouter** for lightweight routing

### Backend
- **Node.js** with **Express.js** framework
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **PostgreSQL** (Neon Database) for data persistence
- **Replit Auth** with OpenID Connect
- **Google Cloud Storage** for file storage

### Development Tools
- **ESBuild** for fast bundling
- **Drizzle Kit** for database migrations
- **TypeScript** for static type checking

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database (or Neon Database account)
- Google Cloud Storage account (for file uploads)
- Replit Auth configuration (for authentication)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/kumaranujranchi/wishluv_hrms.git
cd wishluv_hrms
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Authentication
REPLIT_CLIENT_ID=your_replit_client_id
REPLIT_CLIENT_SECRET=your_replit_client_secret
SESSION_SECRET=your_session_secret

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_STORAGE_BUCKET=your_bucket_name
GOOGLE_APPLICATION_CREDENTIALS=path_to_service_account_key.json

# Application
NODE_ENV=development
PORT=3000
```

### 4. Database Setup
```bash
# Push database schema
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
wishluv_hrms/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   └── utils/         # Helper functions
│   └── index.html
├── server/                 # Backend Express application
│   ├── routes/            # API route handlers
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database configuration
│   ├── storage.ts        # Data access layer
│   └── index.ts          # Server entry point
├── shared/                 # Shared code between client/server
│   ├── schema.ts         # Database schema & validation
│   └── geofencing.ts     # Geolocation utilities
└── package.json
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema changes

## 🏢 Key Features Breakdown

### Attendance System
- GPS-based check-in/check-out
- Geo-fencing for office locations
- Out-of-office tracking
- Real-time location names via reverse geocoding
- Distance calculation from office

### Leave Management
- Multiple leave types (Annual, Sick, Casual, Maternity, Paternity)
- Admin-controlled leave assignments
- Approval workflow with manager hierarchy
- Leave balance tracking

### Payroll System
- Comprehensive salary structure management
- Automated calculations (gross, deductions, net salary)
- Monthly payroll processing
- Detailed salary slips

### Employee Management
- Complete employee profiles
- Onboarding workflow
- Department and designation management
- Role-based access control

## 🔐 Security Features

- Secure authentication with Replit Auth
- Session-based user management
- Role-based access control
- Secure file upload with ACL
- Input validation and sanitization

## 🌐 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables for Production
Ensure all environment variables are properly set in your production environment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: Anuj Kumar
- **Organization**: Wishluv Buildcon

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**Built with ❤️ for modern HR management**