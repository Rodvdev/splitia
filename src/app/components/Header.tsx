'use client';

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface HeaderProps {
  locale: string;
}

export function Header({ locale }: HeaderProps) {
  const router = useRouter();

  // Function to handle login - using current locale
  const handleLogin = () => {
    router.push(`/${locale}/login`);
  };

  // Function to handle signup - using current locale
  const handleSignup = () => {
    router.push(`/${locale}/sign-up`);
  };

  return (
    <header className="py-2 px-4 border-b dark:border-slate-800 sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/${locale}`} className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400 text-transparent bg-clip-text hover:opacity-90 transition-opacity">
            Splitia
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleLogin} className="dark:text-slate-100 dark:hover:text-white dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700">Iniciar sesión</Button>
            <Button onClick={handleSignup} className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-400">Crear cuenta</Button>
          </div>
        </div>
      </div>
    </header>
  );
} 