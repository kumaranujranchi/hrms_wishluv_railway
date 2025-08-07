# HRMS Pro

## Overview

HRMS Pro is a comprehensive Human Resource Management System built as a full-stack web application. The application provides core HR functionalities including attendance tracking with geo-fencing, leave management with approval workflows, expense claim processing, employee directory management, payroll processing, and comprehensive reporting capabilities. The system supports role-based access control with admin, manager, and employee roles, each having appropriate permissions and dashboard views.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and better development experience
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with TypeScript using tsx for development
- **Framework**: Express.js for RESTful API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect integration and Passport.js
- **Session Management**: Express sessions with PostgreSQL store for scalable session persistence

### Database Design
- **Primary Database**: PostgreSQL via Neon Database for reliability and performance
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Key Tables**: 
  - Users table with role-based access (admin, manager, employee)
  - Attendance tracking with geo-location support
  - Leave requests with approval workflows
  - Expense claims with receipt file attachments
  - Payroll records with detailed salary breakdowns
  - Company announcements and settings

### File Storage Strategy
- **Object Storage**: Google Cloud Storage for file attachments (receipts, documents)
- **Access Control**: Custom ACL system for object-level permissions
- **File Upload**: Uppy.js for robust file upload with progress tracking and validation

### Authentication & Authorization
- **Authentication Provider**: Replit Auth with OIDC for secure user authentication
- **Session Storage**: PostgreSQL-backed sessions for scalability
- **Role-Based Access**: Three-tier role system (admin, manager, employee) with appropriate permissions
- **Route Protection**: Server-side middleware for API endpoint protection

### API Architecture
- **Pattern**: RESTful APIs with consistent error handling and response formats
- **Request Logging**: Comprehensive logging middleware for debugging and monitoring
- **Error Handling**: Centralized error handling with appropriate HTTP status codes
- **Data Validation**: Zod schemas for runtime type validation

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL hosting with connection pooling
- **Database Configuration**: Environment-based connection string management

### Cloud Services
- **Google Cloud Storage**: File storage with IAM-based access control
- **Replit Authentication**: OIDC provider for user authentication
- **Replit Object Storage**: Alternative storage backend via sidecar endpoint

### Frontend Libraries
- **UI Framework**: Radix UI primitives for accessibility-first components
- **File Upload**: Uppy ecosystem (@uppy/core, @uppy/dashboard, @uppy/aws-s3)
- **Date Handling**: date-fns for date manipulation and formatting
- **Form Management**: React Hook Form with Zod validation

### Development Tools
- **Type Safety**: TypeScript across the entire stack
- **Code Quality**: ESBuild for production bundling
- **Development Experience**: Vite with HMR and Replit-specific plugins