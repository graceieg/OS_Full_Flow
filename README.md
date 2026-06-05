# OS Full Flow - Quantum Lab Education Platform

A modern web application for quantum lab education, designed to facilitate remote access to quantum computing hardware for students, researchers, and educators.

## Features

- **Multi-Role Authentication System**: Support for three distinct user types:
  - **Students**: Book lab slots, complete assigned experiments, and track progress
  - **Researchers**: Full hardware access with priority queue, recipe authoring, and extended booking slots
  - **Educators**: Manage class rosters, assign experiments, and reserve device pools for teaching sessions

- **Complete User Flow**: From sign-up through verification, onboarding, dashboard, and hardware connection
- **Role-Specific Dashboards**: Customized interfaces and features for each user type
- **Quantum Lab Integration**: Real quantum hardware access with pulse sequence experiments
- **Class Management**: Educators can create class codes, manage seats, and assign experiments

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the project root:
```bash
touch .env.local
```

Add your Supabase credentials (find these in your Supabase dashboard under **Settings → API**):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> ⚠️ Never commit `.env.local` to git. It is already listed in `.gitignore`.

3. Start the development server:
```bash
npm run dev
```

### Demo Login

A test account is available to explore the app without signing up:

| Field    | Value                     |
|----------|---------------------------|
| Email    | testkatmaios@gmail.com    |
| Password | testtest                  |

Or create your own account via the sign-up flow.


### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview the production build

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CSS Modules** - Component styling

## Project Structure

```
src/
├── components/
│   ├── Navigator.tsx          # Navigation component
│   ├── KatmaiLogo.tsx         # Logo component
│   └── screens/              # Screen components
│       ├── SignUp.tsx         # Sign-up screen
│       ├── SignIn.tsx         # Sign-in screen
│       ├── Verify.tsx         # Email verification
│       ├── Onboarding.tsx     # User onboarding flow
│       ├── Dashboard.tsx      # Main dashboard
│       └── Connect.tsx        # Hardware connection
├── data.ts                    # Role profiles and configuration
├── types.ts                   # TypeScript type definitions
├── App.tsx                    # Main application component
└── main.tsx                   # Application entry point
```

## User Roles

### Student
- Book open slots on shared lab devices
- Complete assigned experiments (e.g., spin-echo T₂* measurements)
- Track progress through courses and modules
- Join classes via educator-provided codes

### Researcher
- Full hardware booking with priority queue
- Author and version custom pulse recipes
- Extended time slots for experiments
- No class code required

### Educator
- Create and manage class codes
- Assign experiments to students
- Reserve device pools for class sessions
- Track student progress and completion rates

## Development

This project uses Vite for fast development with hot module replacement. TypeScript provides type safety throughout the application.
