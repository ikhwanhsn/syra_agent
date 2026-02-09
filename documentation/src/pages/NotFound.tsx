 import { Link, useLocation } from "react-router-dom";
 import { useEffect } from "react";
 import { ArrowLeft, Home } from "lucide-react";
 import { Button } from "@/components/ui/button";
 
 const NotFound = () => {
   const location = useLocation();
 
   useEffect(() => {
     // Avoid logging pathname to prevent sensitive paths in log aggregation
     console.error("404 Error: User attempted to access non-existent route");
   }, [location.pathname]);
 
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-background px-4 safe-bottom">
      <div className="text-center max-w-md w-full">
         <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
           <span className="text-4xl font-bold text-primary">404</span>
         </div>
         <h1 className="text-2xl font-bold mb-2">Page not found</h1>
         <p className="text-muted-foreground mb-8">
           The page you're looking for doesn't exist or has been moved.
         </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 w-full sm:w-auto">
          <Button variant="ghost" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
            <Link to="/docs">
              <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
              Go back
            </Link>
          </Button>
          <Button variant="primary" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
            <Link to="/docs">
              <Home className="mr-2 h-4 w-4 shrink-0" />
              Documentation
            </Link>
          </Button>
        </div>
       </div>
     </div>
   );
 };
 
 export default NotFound;
