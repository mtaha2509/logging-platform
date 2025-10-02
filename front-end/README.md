# Centralized Logging Platform - Frontend MVP

This is the MVP (Minimum Viable Product) implementation of the Centralized Logging Platform frontend, built with Oracle JET vDOM and migrated from the original Next.js design.

## 🚀 Features Implemented

### ✅ MVP Release 1.0

- **Authentication & Role Management**
  - Login screen with role selection (Admin, Developer, Operations, Auditor)
  - Role-based navigation and access control
  - User context management with localStorage simulation

- **App Shell & Navigation**
  - Fixed header with user menu and role badge
  - Collapsible sidebar with role-based menu items
  - Responsive layout with mobile support
  - Smooth transitions and Oracle Redwood theming

- **Dashboard Pages**
  - Role-aware dashboards (Admin vs Developer vs Others)
  - Statistics cards with mock data
  - Quick action buttons
  - Application overview panels

- **Log Query Interface**
  - Advanced search with filters (applications, severity, time range)
  - Real-time log results table
  - Export functionality (CSV/JSON)
  - Copy to clipboard features
  - Loading states and empty states

- **Application Management** (Admin only)
  - Register new applications
  - View application list with search
  - Application status tracking
  - Copy application IDs
  - Delete applications

- **User Management** (Admin only)
  - User list with search functionality
  - Assign applications to users
  - Role-based access control
  - User status management

## 🛠️ Technology Stack

- **Framework**: Oracle JET 19.0 with vDOM (Preact)
- **TypeScript**: For type safety and better development experience
- **Oracle Redwood**: Design system for consistent UI
- **Routing**: OJET Router with dynamic routes
- **State Management**: Local state with context for user management
- **Components**: Custom OJET component wrappers

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx       # Main app layout
│   │   ├── app-header.tsx      # Top navigation
│   │   └── app-sidebar.tsx     # Side navigation
│   ├── pages/
│   │   ├── login.tsx           # Login page
│   │   ├── dashboard.tsx       # Role-aware dashboard
│   │   ├── logs.tsx            # Log query interface
│   │   ├── applications.tsx    # App management (admin)
│   │   └── users.tsx           # User management (admin)
│   ├── app.tsx                 # Root app component
│   ├── header.tsx              # Original header (legacy)
│   └── footer.tsx              # Footer component
├── contexts/
│   └── user-context.tsx        # User state management
├── types/
│   └── ojet-components.d.ts    # TypeScript declarations
└── styles/
    └── app.css                 # Custom styles
```

## 🎯 Role-Based Access

### Administrator
- Dashboard with full system overview
- Application management (register, view, delete)
- User management (assign apps, manage roles)
- Full access to all features

### Developer
- Dashboard with personal applications
- Log query access
- View assigned applications
- Create alerts and visualizations

### Operations
- System monitoring dashboard
- Log query access
- Alert management
- System health monitoring

### Auditor
- Audit-focused dashboard
- Read-only log access
- Audit trail access
- Compliance reporting

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npx ojet serve
   ```

3. **Access the Application**
   - Open http://localhost:8000
   - Use any email and select a role to login
   - Demo mode allows switching between roles

## 🎨 Design System

The application uses Oracle's Redwood design system with:
- Consistent color tokens
- Responsive typography
- Accessible components
- Dark/light theme support (ready for future implementation)

## 📝 Mock Data

The MVP uses mock data for demonstration:
- Pre-populated applications
- Simulated log entries
- Sample user accounts
- Realistic statistics

## 🔜 Future Releases

### Release 2.0 (Planned)
- [ ] Alert management system
- [ ] Data visualizations with charts
- [ ] Audit trail interface
- [ ] Real API integration
- [ ] Advanced filtering options

### Release 3.0 (Planned)
- [ ] Dark mode implementation
- [ ] Real-time log streaming
- [ ] Advanced user permissions (RBAC)
- [ ] Dashboard customization
- [ ] Export improvements

## 🏗️ Architecture Notes

### Routing
- Uses OJET Router with path-based routing
- Dynamic segments for application details
- Query parameter support for pre-filtering

### State Management
- User context for authentication state
- Local component state for UI interactions
- localStorage for session persistence

### Component Strategy
- Functional components with hooks
- Preact/JSX for virtual DOM
- Oracle JET components for UI primitives
- TypeScript for type safety

## 🔧 Development Notes

### Adding New Pages
1. Create component in `src/components/pages/`
2. Add route to router configuration in `app.tsx`
3. Update navigation items in `app-sidebar.tsx`
4. Add role-based access control

### Styling Guidelines
- Use Oracle Redwood design tokens
- Follow BEM naming convention for custom classes
- Responsive-first approach
- Maintain accessibility standards

### TypeScript Support
- Custom type declarations for OJET components
- Strict type checking enabled
- Interface definitions for data models

## 🔧 Implementation Notes

### OJET Component Strategy
- **Working Components**: Uses native OJET components (buttons, inputs, labels, menus, toolbars) that exist in v19.0.0
- **Replaced Components**: 
  - `oj-panel` → `<div class="oj-panel oj-panel-alt1">` (CSS-only styling)
  - `oj-badge` → `<span class="oj-badge oj-badge-*">` (CSS-only styling) 
  - `oj-select-single` → `<select>` with OJET styling (component doesn't exist)
  - `oj-text-area` → `<textarea>` with custom styling (component doesn't exist)
  - `oj-dialog` → Custom modal implementation (opened/onopenedChanged props not supported)
- **Event Handling**: Fixed event handler naming and menu action handling for OJET compatibility

### TypeScript Configuration
- Custom component type declarations in `src/types/ojet-components.d.ts`
- Proper event handler naming (`onvalueChanged` instead of `onValueChanged`)
- Support for OJET component properties and styling

### Hash-Based Routing
- Simple hash-based routing system instead of complex OJET Router
- URL format: `#dashboard`, `#logs`, etc.
- Browser back/forward navigation support

## 📞 Support

For development questions or issues:
1. Check Oracle JET documentation
2. Review component APIs in OJET docs
3. Test with different user roles for access control

---

**MVP Status**: ✅ Ready for Demo
**Next Release**: Planning Phase
