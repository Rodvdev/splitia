UI Design Guidelines for Splitia

🎨 Brand Color Palette

Primary Color: #66e3a5 (Mint Green)

Accent Color: Complementary soft neutrals (light gray, white, black)

Success: #4ade80

Warning: #facc15

Error: #f87171

✨ General Aesthetic

Clean, minimal, and friendly

Rounded corners (rounded-2xl) for inputs, cards, buttons

Soft drop shadows (shadow-md to shadow-lg) for elevation

Large font sizes for headlines (text-2xl, text-3xl) with light weight

Plenty of spacing and white space (p-4, gap-6)

🧱 Layout

Use grid layouts for pages (grid grid-cols-12) where needed

Sidebar width fixed (w-64), with active item highlight using brand color

Consistent padding on page content (p-6 or p-8)

🧩 Components (ShadCN-based)

Buttons

bg-[#66e3a5] text-black for primary

bg-white border border-[#66e3a5] text-[#66e3a5] for secondary

Rounded (rounded-full) for pill style actions

Inputs & Forms

Full width by default (w-full)

Use focus:ring-[#66e3a5] for focus states

Helper text and validation below each input

Cards

Rounded corners (rounded-2xl)

Use bg-white or bg-neutral-100

Padding inside (p-6), optional header and footer

Modals

Centered with max-w-lg

Always with a close icon in top-right

Scrollable content if needed (overflow-y-auto)

Badges / Tags

Use soft tones of primary or category colors

bg-[#66e3a5]/20 text-[#66e3a5] for selected categories

💱 Currency Display

Use consistent currency formatting based on locale

Display currency symbol in muted color (text-neutral-500)

Right-align numerical values in tables and lists

Always show currency symbol before amount for Western currencies, after for others (based on locale)

Use dropdown selectors with flag icons for currency selection

🌐 Internationalization

Support RTL layouts for applicable languages

Use relative units (rem) instead of fixed pixel sizing where possible

Ensure text elements can expand/contract with translations

Implement language selector in user settings and footer

Keep adequate spacing for longer text in other languages

🧠 UX Guidelines

Always show confirmation toasts after actions

Keep forms short; use steps or sections if long

Autofocus first field on modals or forms

Use placeholders and examples (e.g. Taxi from airport)

Always allow cancel or go-back actions

Use invitation link cards with copy button and QR code option

📱 Responsiveness

Mobile-first approach

Collapse sidebar to icon nav (lg:hidden) with menu toggle

Ensure all modals, forms, and chat are responsive (max-w-full)

Note: This file governs the UI consistency for all Splitia interfaces. All designers and developers must refer to this when implementing new features.