import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Splitia - Expense Splitting Made Easy",
  description: "A simple expense splitting application for groups with internationalization and multi-currency support",
  keywords: ["expense tracker", "bill splitting", "group expenses", "finance app"],
  authors: [{ name: "Splitia Team" }],
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
}; 