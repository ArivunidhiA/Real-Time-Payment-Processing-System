# Frontend Setup Guide

This guide will help you set up the frontend with shadcn/ui, TypeScript, and the gradient background animations.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## 🚀 Setup Steps

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install all required dependencies including:
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui utilities (clsx, tailwind-merge)
- Framer Motion (for animations)
- Lucide React (for icons)
- Recharts (for charts)

### 2. Project Structure

The project now follows shadcn/ui structure:

```
frontend/
├── components/
│   ├── ui/                    # shadcn/ui components
│   │   └── background-gradient-animation.tsx
│   ├── StatsCards.tsx        # Stats cards component
│   ├── VolumeChart.tsx       # Volume chart component
│   └── TransactionTable.tsx  # Transaction table component
├── lib/
│   └── utils.ts              # Utility functions (cn helper)
├── pages/
│   ├── _app.tsx              # App wrapper
│   └── index.tsx             # Main dashboard page
├── styles/
│   └── globals.css           # Global styles with Tailwind
├── components.json           # shadcn/ui configuration
├── tsconfig.json             # TypeScript configuration
└── tailwind.config.js        # Tailwind configuration with animations
```

### 3. TypeScript Configuration

The project is fully converted to TypeScript. The `tsconfig.json` includes:
- Path aliases (`@/*` for root imports)
- Strict type checking
- Next.js optimizations

### 4. shadcn/ui Setup

The project uses shadcn/ui structure with:
- `components/ui/` folder for UI components
- `lib/utils.ts` for the `cn()` utility function
- `components.json` for configuration

**Important**: The `components/ui` folder is essential because:
- It follows shadcn/ui conventions
- Makes it easy to add more shadcn/ui components later
- Keeps UI components organized and reusable

### 5. Tailwind Configuration

The `tailwind.config.js` includes:
- Custom animations for gradient backgrounds
- Extended color palette
- Dark mode support

### 6. Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🎨 Features Implemented

### Background Gradient Animation
- Interactive gradient background on all pages
- Mouse-following gradient effects
- Smooth animations with CSS keyframes
- Customizable colors and blending modes

### Enhanced Components
- **StatsCards**: Animated cards with icons and hover effects
- **VolumeChart**: Smooth area chart with gradient fills
- **TransactionTable**: Animated table rows with status badges

### Animations
- Framer Motion for smooth page transitions
- Hover effects on interactive elements
- Staggered animations for lists
- Loading states with skeleton screens

## 🔧 Adding More shadcn/ui Components

To add more shadcn/ui components:

1. Install shadcn CLI (if not already installed):
```bash
npx shadcn-ui@latest init
```

2. Add components:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
# etc.
```

Components will be added to `components/ui/` automatically.

## 📝 TypeScript Usage

All components are now TypeScript. When creating new components:

```tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  count: number;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, count }) => {
  return (
    <div>
      <h1>{title}</h1>
      <p>{count}</p>
    </div>
  );
};

export default MyComponent;
```

## 🎯 Key Features

1. **Gradient Background**: Applied to all pages via `BackgroundGradientAnimation`
2. **Smooth Animations**: Framer Motion for page transitions and interactions
3. **Interactive Charts**: Recharts with custom tooltips and gradients
4. **Type Safety**: Full TypeScript support
5. **Modern UI**: Glassmorphism effects with backdrop blur
6. **Responsive**: Mobile-friendly design

## 🐛 Troubleshooting

### TypeScript Errors
- Make sure all dependencies are installed
- Check that `tsconfig.json` paths are correct
- Restart the TypeScript server in your IDE

### Tailwind Not Working
- Ensure `tailwind.config.js` content paths are correct
- Check that `globals.css` imports Tailwind directives
- Restart the dev server

### Animations Not Showing
- Check browser console for errors
- Ensure Framer Motion is installed
- Verify Tailwind animations are in config

### Gradient Not Appearing
- Check that `BackgroundGradientAnimation` wraps your content
- Verify CSS variables are set in `globals.css`
- Check browser support for CSS filters

## 📦 Dependencies

Key dependencies:
- `next`: React framework
- `react` & `react-dom`: React library
- `typescript`: TypeScript support
- `tailwindcss`: Utility-first CSS
- `framer-motion`: Animation library
- `recharts`: Chart library
- `lucide-react`: Icon library
- `clsx` & `tailwind-merge`: Utility functions

## 🚀 Production Build

```bash
npm run build
npm start
```

The production build will be optimized and ready for deployment.

---

**The frontend is now fully set up with shadcn/ui, TypeScript, and beautiful gradient animations!**

