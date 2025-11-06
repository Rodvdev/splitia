import React from 'react';

type ClientLayoutProps = {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default function DashboardClientLayout({
  children
}: ClientLayoutProps) {

  return (
    <div className="flex min-h-screen">

      {/* Main content wrapper - transparent to show background */}
      <div className="flex flex-1 flex-col overflow-hidden relative">

        {/* Main content */}
        <main className="flex-1 overflow-auto relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
} 