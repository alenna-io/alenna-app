# Alenna - Educational Management System

A modern, responsive educational management platform built with React, TypeScript, and shadcn/ui. Designed specifically for ACE (Accelerated Christian Education) curriculum tracking and student progress management.

## 🚀 Features

### 🎓 Core Educational Features
- **📊 PACE Projection System** - Plan and track student progress across quarterly blocks
- **📈 Progress Tracking** - Real-time completion status and grade tracking
- **👨‍🎓 Student Management** - Comprehensive student profiles and academic records
- **📅 Weekly Planning** - Interactive 9-week quarterly schedules
- **🎯 Daily Goals System** - Comprehensive daily goal tracking with page calculations and notes
- **📝 Notes & History** - Track pending items and maintain completion history

### 🛠️ Technical Features
- **🔐 Authentication** - Secure user authentication with Clerk
- **🏫 Multi-Tenant Architecture** - Data isolation by school/organization
- **🔌 REST API Integration** - Connected to Node.js/Express backend
- **📱 Mobile-First Design** - Fully responsive across all devices
- **🎨 Modern UI** - Beautiful interface built with shadcn/ui components
- **🗂️ Smart Navigation** - Collapsible sidebar with intuitive routing
- **⚡ Fast Performance** - Hot reload with Vite
- **📦 Type Safe** - Full TypeScript support with strict mode

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Authentication**: Clerk
- **Routing**: React Router v7
- **Build Tool**: Vite
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Clerk account for authentication

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd alenna-app
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000/api/v1

# Clerk Authentication (Frontend)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

Get your Clerk keys from [clerk.com](https://clerk.com)

**Note**: Make sure the backend API is running before starting the frontend. See `../alenna-api/README.md` for backend setup instructions.

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── confirm-dialog.tsx  # Confirmation dialogs
│   │   ├── sidebar.tsx
│   │   └── ...
│   ├── ace-quarterly-table.tsx  # PACE projection table
│   ├── daily-goals-table.tsx    # Daily goals tracking table
│   ├── app-sidebar.tsx          # Main navigation
│   └── footer.tsx               # App footer
├── layouts/
│   └── dashboard-layout.tsx     # Dashboard layout wrapper
├── pages/
│   ├── ace-projection.tsx       # PACE projection view
│   ├── projection-list.tsx      # Student projections list
│   ├── daily-goals.tsx          # Weekly goals breakdown
│   ├── students.tsx             # Student management
│   ├── dashboard.tsx            # Dashboard page
│   ├── home.tsx                 # Home page
│   ├── login.tsx                # Login page
│   └── signup.tsx               # Sign up page
├── types/
│   └── pace.ts                  # PACE data types
├── hooks/
│   └── use-mobile.ts            # Mobile detection hook
├── lib/
│   └── utils.ts                 # Utility functions
└── App.tsx                      # Main app component with routing
```

## 🎯 PACE Projection System

The core feature of Alenna is the PACE (Personalized ACE Curriculum) projection and tracking system:

### 📊 Quarterly Tables
- **Interactive Planning Grid** - 9-week x 6-subject matrix per quarter
- **Drag & Drop** - Easily reschedule PACEs between weeks
- **Real-time Progress** - Visual completion tracking with percentages
- **Smart Validation** - Prevents duplicates and validates PACE formats
- **Overload Warnings** - Alerts when exceeding recommended limits (18 PACEs/quarter)

### ✏️ PACE Management
- **Add PACEs** - Click empty cells to add new PACEs (format: 1XXX)
- **Track Grades** - Enter grades (0-100) with color-coded indicators:
  - 🟢 90-100%: Excellent
  - 🔵 80-89%: Good  
  - 🔴 Below 80%: Needs attention
- **Grade History** - Track all grade attempts with notes and timestamps
- **Failed PACEs Tracking** - Separate summary for failed PACEs with completion history
- **Context Menu** - Right-click options for editing, notes, and grade history
- **Completion Status** - Visual checkmarks for completed work
- **Comments** - Add optional comments when submitting grades

### 📈 Progress Tracking
- **Quarter Summaries** - Expected, completed, pending, and failed PACEs
- **Current Week Highlight** - Green background for active week
- **Subject Color Coding** - Blue/gray alternating rows for clarity
- **Sticky Columns** - Subject names stay visible while scrolling

## 📅 Daily Goals System

A comprehensive daily goal tracking system integrated with the PACE projections:

### 🎯 Goal Planning
- **Daily Structure** - Track goals for Monday through Friday
- **Subject Coverage** - All 6 subjects (Math, English, Science, Social Studies, Word Building, Spanish)
- **Flexible Input** - Support for page ranges (1-1000), ST, or T
- **Auto-calculation** - Automatic daily page totals
- **One Table Per Week** - Organized by student, quarter, and week

### ✍️ Input Formats
- **Page Ranges** - Enter any range from 1-1000 (e.g., "1-10", "45-67", "999-1000")
- **ST** - Self Test option that counts as 3 pages
- **T** - Test option that counts as 1 page
- **Single Pages** - Enter individual page numbers (e.g., "500")
- **Smart Validation** - Real-time input validation with visual feedback:
  - ✅ "1-10" → 10 pages
  - ✅ "45-67" → 23 pages
  - ✅ "ST" → 3 pages
  - ✅ "T" → 1 page
  - ✅ "500" → 1 page
  - ❌ "0-5" (0 not allowed)
  - ❌ "01-10" (no leading zeros)
  - ❌ Invalid formats show red border with error message

### ✔️ Completion Tracking
- **Visual Checkboxes** - Always visible completion indicators
- **Click to Toggle** - Mark goals as complete/incomplete
- **Strike-through Text** - Completed goals show with line-through styling
- **Progress Summary** - Track completed vs. total goals with percentage

### 📝 Notes System
- **Pending Notes**:
  - Red pencil icon for active notes
  - Enhanced red note box with "PENDIENTE" label
  - Add notes for partially completed goals
  - Notes automatically complete when goal is marked complete
  
- **Notes History**:
  - Orange history icon when only archived notes exist
  - Complete notes are archived with timestamp
  - View historical notes in modal dialog
  - Auto-archive notes when goal is marked complete

### 📊 Page Calculation
- **Automatic Totals** - Daily page totals calculated in real-time
- **Smart Parsing**:
  - Page ranges: "45-46" → 2 pages (46 - 45 + 1)
  - ST: "ST" → 3 pages (fixed)
  - T: "T" → 1 page (fixed)
  - Single pages: "5" → 1 page
  - Empty: "" → 0 pages
- **Non-editable Total** - Total column is read-only and auto-calculated
- **Real-time Updates** - Totals update as you modify goals

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) for UI components:

- **Sidebar** - Collapsible navigation with icon mode
- **Button** - Various button variants with Lucide icons
- **Card** - Content containers for projections
- **Badge** - Status and label indicators
- **Dialog** - Confirmation and alert modals
- **Input** - Validated form inputs
- **Separator** - Visual dividers
- **Sheet** - Mobile sidebar overlay
- **Tooltip** - Contextual help
- **Avatar** - Student profile images
- **Skeleton** - Loading placeholders

## 📱 Responsive Design

### Desktop (> 768px)
- Full sidebar with text labels
- Horizontal table layout
- Multi-column summaries

### Tablet (640px - 768px)
- Collapsible sidebar
- Horizontal scroll tables
- Adaptive card layouts

### Mobile (< 640px)
- Off-canvas sidebar overlay
- Touch-optimized controls
- Stacked vertical layouts
- Condensed labels

## 🔧 Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linting
pnpm lint

# Type checking
pnpm type-check
```

## 🎯 Key Features

### 🎓 Educational Management
- **Student Profiles** - Comprehensive student information and academic records
- **PACE Planning** - Quarterly projection across 4 blocks (Q1-Q4)
- **Progress Monitoring** - Real-time completion and grade tracking
- **Weekly Goals** - Breakdown of daily objectives per week
- **Multi-Subject Support** - Math, English, Science, Social Studies, Word Building, Spanish

### 🔐 Authentication
- Sign in/Sign up with Clerk
- Protected routes with role-based access
- User profile management
- Secure session handling

### 🗺️ Navigation
- Collapsible sidebar with icons
- Active route highlighting
- Breadcrumb navigation
- Mobile-friendly drawer
- Keyboard shortcuts (Ctrl/Cmd + B)

### 🎨 Layout & Design
- Responsive grid system
- Consistent spacing and typography
- Modern card-based layouts
- Smooth animations and transitions
- App footer with version info

## 🛣️ Application Routes

### Public Routes
- `/login` - User login
- `/signup` - User registration

### Protected Routes
- `/` - Home dashboard
- `/students` - Student list and management
- `/students/:studentId` - Student profile
- `/students/:studentId/projections` - Student's PACE projections list
- `/students/:studentId/projections/:projectionId` - Quarterly projection view
- `/students/:studentId/projections/:projectionId/goals/:quarter/:week` - Daily goals tracking

## 🚀 Deployment

### Build for Production

```bash
pnpm build
```

The build artifacts will be stored in the `dist/` directory.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables for Production

Make sure to set your Clerk keys in your deployment platform:

- `VITE_CLERK_PUBLISHABLE_KEY`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📖 Usage Examples

### PACE Projection

#### Adding a PACE
```typescript
// Click on an empty cell in the projection table
// Enter PACE number (e.g., "1001")
// Press Enter or click confirm
```

#### Tracking Completion
```typescript
// Click on a PACE number
// Enter grade (0-100)
// Optionally add a comment
// PACE is marked complete with color indicator
```

#### Viewing Grade History
```typescript
// Click on options menu (three dots)
// Select "Ver Historial de Grados"
// View all grade attempts with dates and notes
```

#### Rescheduling PACEs
```typescript
// Drag a PACE cell
// Drop it on a different week in the same subject
// Updates automatically
```

### Daily Goals

#### Setting Daily Goals
```typescript
// Navigate to Daily Goals page
// Click on any cell to set a goal
// Enter a page range (e.g., "1-10"), ST, or T
// Click green check to save
```

#### Tracking Goal Completion
```typescript
// Click checkbox next to a goal to mark as complete
// Goal shows with strike-through styling
// Daily total updates automatically
```

#### Adding Notes
```typescript
// Click pencil icon on a goal
// Enter note for partially completed work
// Note appears in red "PENDIENTE" box
// Note automatically completes when goal is marked complete
```

#### Viewing Notes History
```typescript
// Click history icon (orange) on a goal
// View all archived notes with completion dates
// Closed modal by clicking X or "Cerrar" button
```

## 🔐 Validation Rules

### PACE Numbers
- Must be exactly 4 digits
- Must start with 1 (e.g., 1001-1999)
- Cannot duplicate within same subject
- Automatically validated on input

### Grades
- Range: 0-100
- Numeric input only
- Color-coded display:
  - Green (90-100): Excellent
  - Blue (80-89): Good
  - Red (< 80): Needs Attention
- Optional comment field available

### Daily Goals
- **Page Ranges**: 
  - Format: `start-end` where both are 1-1000
  - Start must be ≤ end
  - Example: "1-10", "45-67", "999-1000"
- **ST (Self Test)**: 
  - Case insensitive ("ST", "st", "St")
  - Fixed value of 3 pages
- **T (Test)**: 
  - Case insensitive ("T", "t")
  - Fixed value of 1 page
- **Single Pages**:
  - Format: Single number 1-1000
  - Example: "5", "100", "500"
- **Invalid Formats**:
  - Numbers starting with 0 (except standalone "0" if allowed)
  - Non-numeric characters
  - Numbers outside 1-1000 range
  - Visual feedback with red border and error message

### Quarter Limits
- Recommended max: 18 PACEs per quarter
- Warning displayed when exceeded
- Can bypass with "Remember for 10 minutes" option

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Clerk](https://clerk.com/) for authentication
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide React](https://lucide.dev/) for icons
- [React Router](https://reactrouter.com/) for navigation
- [Vite](https://vitejs.dev/) for blazing fast builds

---

Built with ❤️ for educators using the ACE curriculum system.

**Version**: 1.0.0  
**Author**: Alenna Team  
**License**: MIT