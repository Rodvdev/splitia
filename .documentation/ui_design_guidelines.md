# UI Design Guidelines for Splitia

## 🎨 Brand Identity

**Primary Color:** #66e3a5 (Mint Green)
**Secondary Color:** #4f46e5 (Indigo)

**Accent Colors:**
- Success: #4ade80 (Green)
- Warning: #facc15 (Yellow)
- Error: #f87171 (Red)
- Info: #38bdf8 (Blue)

**Typography:**
- Primary Font: Geist (Sans)
- Monospace: Geist Mono
- Headings: Font weight 700 (bold)
- Body: Font weight 400 (regular)

## 🧩 Design System

### General Principles
- **Minimalist & Functional:** Focus on user tasks with clean interfaces
- **Consistent Visual Hierarchy:** Clear information structure
- **Responsive Design:** Mobile-first approach with fluid layouts
- **Accessibility:** WCAG AA compliance with proper contrast and focus states

### Layout
- **Container Width:** max-w-6xl for main content areas
- **Grid System:** Tailwind's grid with responsive columns
- **Spacing:** Consistent spacing using Tailwind's spacing scale
  - Section padding: py-24 px-6
  - Component padding: p-6 (cards), p-4 (inputs)
  - Gap between elements: gap-8 (large), gap-4 (medium), gap-2 (small)

### Components

#### Buttons
- **Primary:** bg-primary text-primary-foreground hover:bg-primary/90
- **Secondary:** bg-secondary text-secondary-foreground hover:bg-secondary/90
- **Outline:** border border-input bg-background hover:bg-accent hover:text-accent-foreground
- **Ghost:** hover:bg-accent hover:text-accent-foreground
- **Destructive:** bg-destructive text-destructive-foreground hover:bg-destructive/90
- **Link:** text-primary underline-offset-4 hover:underline
- **Sizes:** xs, sm, md (default), lg, xl
- **Corners:** rounded-md (default), rounded-full (special cases)

#### Cards
- **Default:** bg-card text-card-foreground rounded-xl border shadow-sm
- **Interactive:** hover:shadow-md transition-shadow
- **Header:** p-6 pb-2 flex justify-between items-start
- **Content:** p-6
- **Footer:** p-6 pt-0 border-t mt-6

#### Forms & Inputs
- **Text Inputs:** w-full rounded-md border border-input px-3 py-2
- **Focus State:** ring-2 ring-primary
- **Select:** Same as text inputs with dropdown icon
- **Checkboxes/Radios:** Custom design with primary color
- **Labels:** text-sm font-medium text-foreground mb-2
- **Helper Text:** text-sm text-muted-foreground mt-1
- **Validation:** Error messages in text-destructive

#### Navigation
- **Header:** sticky top-0 z-50 bg-background/80 backdrop-blur-md
- **Sidebar:** w-64 bg-sidebar text-sidebar-foreground
- **Active States:** bg-primary/10 text-primary
- **Mobile Nav:** Collapsible with hamburger menu

#### Data Display
- **Tables:** Full width with borders or divide-y for rows
- **Lists:** Space between items with consistent indentation
- **Badges:** bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full

#### Feedback
- **Toast Messages:** Fixed position, brief display (3-5 seconds)
- **Modal Dialogs:** Centered, with backdrop overlay
- **Loading States:** Skeleton loaders and spinner animations

## 🎭 Dark Mode
- **Background:** bg-background (light: white, dark: rgb(9, 9, 11))
- **Foreground:** text-foreground (light: black, dark: white)
- **Muted:** bg-muted text-muted-foreground
- **Card:** bg-card text-card-foreground
- **Border Color:** border-border (light: gray-200, dark: gray-800)

## 📱 Responsive Design

### Breakpoints
- **sm:** 640px (Small devices like phones)
- **md:** 768px (Medium devices like tablets)
- **lg:** 1024px (Large devices like laptops)
- **xl:** 1280px (Extra large devices like desktops)
- **2xl:** 1536px (Ultra wide screens)

### Responsive Patterns
- Single column layouts on mobile
- Two or three columns on tablet
- Multi-column grid on desktop
- Font size adjustments for headings (text-2xl md:text-3xl lg:text-4xl)
- Hidden/revealed elements based on screen size (hidden md:block)

## 💱 Currency Display
- Currency symbols before amount for Western currencies
- Two decimal places standard (more for cryptocurrencies)
- Thousands separators according to locale
- Right-aligned in tables and comparison views

## 🌐 Internationalization
- Text direction support (RTL for Arabic, Hebrew)
- Date/time formatting based on locale
- Number formatting with proper decimal/thousands separators
- Expandable text containers for translations

## 🧠 Interaction Design
- Hover effects for interactive elements (hover:bg-accent)
- Active/pressed states (active:scale-95)
- Focus states for keyboard navigation (focus-visible:ring-2)
- Transition animations for state changes (transition-all duration-200)
- Subtle micro-interactions for feedback

## 📁 Icon System
- Lucide icons as the primary icon library
- Consistent sizing: h-4 w-4 (small), h-5 w-5 (medium), h-6 w-6 (large)
- Icons should maintain the same visual weight
- Color should match text they accompany or use primary for emphasis

---

*This style guide should be followed for all Splitia components and new features to maintain design consistency across the platform.*