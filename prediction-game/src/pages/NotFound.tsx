import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center glass-card p-12 max-w-md animate-fade-in-up">
        <h1 className="mb-4 text-6xl md:text-7xl font-bold gradient-text">404</h1>
        <p className="mb-8 text-xl text-muted-foreground">Oops! Page not found</p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 rounded-lg font-semibold text-primary border border-primary/30 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_hsl(270_70%_60%/0.3)]"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
