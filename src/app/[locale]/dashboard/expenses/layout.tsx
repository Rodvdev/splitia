import ExpensesLayoutClient from "./layout-client";
import type { Viewport } from "next";

// Define viewport configuration
export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function ExpensesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ExpensesLayoutClient>{children}</ExpensesLayoutClient>;
} 