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
    <div className="flex min-h-screen bg-white">

      {/* Main content wrapper with grid background */}
      <div className="flex flex-1 flex-col overflow-hidden relative bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Grid pattern background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
} 