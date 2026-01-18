# Lovable Project

This project was set up to be compatible with [Lovable](https://lovable.dev) (formerly GPT Engineer).

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **React Router** - Client-side routing
- **React Query** - Server state management
- **React Hook Form + Zod** - Form handling and validation
- **Lucide React** - Beautiful icons
- **Recharts** - Charts and data visualization
- **Sonner** - Toast notifications

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (version 18 or higher recommended).

### Installation

1. Navigate to the project directory:
   ```bash
   cd lovable-project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:8080](http://localhost:8080) in your browser.

## How to Use Code from Lovable

When you copy code from Lovable:

1. **Pages** go in `src/pages/` - Make sure to add routes in `src/App.tsx`
2. **Components** go in `src/components/`
3. **UI Components** (shadcn/ui) go in `src/components/ui/`
4. **Hooks** go in `src/hooks/`
5. **Utilities** go in `src/lib/`

### Adding New Routes

Edit `src/App.tsx` and add your route above the catch-all `"*"` route:

```tsx
<Route path="/your-page" element={<YourPage />} />
```

## Included shadcn/ui Components

The following components are pre-installed:

- Accordion
- Alert
- AlertDialog
- Avatar
- Badge
- Button
- Calendar
- Card
- Checkbox
- Dialog
- Drawer
- DropdownMenu
- Input
- Label
- Popover
- Progress
- RadioGroup
- ScrollArea
- Select
- Separator
- Skeleton
- Slider
- Sonner (toast)
- Switch
- Table
- Tabs
- Textarea
- Toast
- Tooltip

## Project Structure

```
lovable-project/
├── src/
│   ├── components/
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── pages/            # Page components
│   ├── App.tsx           # Main app with routing
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles & Tailwind
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── components.json       # shadcn/ui configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Need More Components?

If you need additional shadcn/ui components that aren't included, you can add them using:

```bash
npx shadcn-ui@latest add [component-name]
```

For example:
```bash
npx shadcn-ui@latest add carousel
npx shadcn-ui@latest add form
```
