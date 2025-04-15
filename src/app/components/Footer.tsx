'use client';

export function Footer() {
  return (
    <footer className="py-8 px-6 border-t dark:border-slate-800 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400 text-transparent bg-clip-text">Splitia</h2>
            <p className="text-sm text-muted-foreground dark:text-slate-400">Simplicidad financiera en tu mano</p>
          </div>
          
          <div className="text-sm text-muted-foreground dark:text-slate-500">
            © {new Date().getFullYear()} Splitia. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
} 