# Alenna - SaaS Application

A modern, responsive SaaS application built with React, TypeScript, and shadcn/ui, featuring authentication, sidebar navigation, and a clean dashboard interface.

## 🚀 Features

- **🔐 Authentication** - Secure user authentication with Clerk
- **📱 Responsive Design** - Mobile-first design that works on all devices
- **🎨 Modern UI** - Beautiful interface built with shadcn/ui components
- **🗂️ Sidebar Navigation** - Collapsible sidebar with smooth transitions
- **🌙 Dark Mode Ready** - Built-in dark mode support
- **⚡ Fast Development** - Hot reload with Vite
- **📦 Type Safe** - Full TypeScript support

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
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

Get your Clerk keys from [clerk.com](https://clerk.com)

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   └── app-sidebar.tsx  # Main sidebar component
├── layouts/
│   └── dashboard-layout.tsx  # Dashboard layout wrapper
├── pages/
│   ├── dashboard.tsx    # Dashboard page
│   ├── home.tsx         # Home page
│   ├── login.tsx        # Login page
│   └── signup.tsx       # Sign up page
├── hooks/
│   └── use-mobile.ts    # Mobile detection hook
├── lib/
│   └── utils.ts         # Utility functions
└── App.tsx              # Main app component
```

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) for UI components:

- **Sidebar** - Collapsible navigation with icon mode
- **Button** - Various button variants
- **Input** - Form input components
- **Separator** - Visual dividers
- **Sheet** - Mobile sidebar overlay
- **Tooltip** - Hover tooltips
- **Skeleton** - Loading placeholders

## 📱 Responsive Design

- **Desktop**: Full sidebar with text labels
- **Mobile**: Off-canvas sidebar with overlay
- **Collapsed**: Icon-only mode with tooltips

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

### Authentication
- Sign in/Sign up with Clerk
- Protected routes
- User profile management

### Navigation
- Collapsible sidebar
- Active route highlighting
- Mobile-friendly navigation
- Keyboard shortcuts (Ctrl/Cmd + B)

### Layout
- Responsive grid system
- Consistent spacing
- Dark mode ready
- Smooth animations

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

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Clerk](https://clerk.com/) for authentication
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide React](https://lucide.dev/) for icons

---

Built with ❤️ using React, TypeScript, and modern web technologies.