import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link to="/" className="text-primary underline-offset-4 hover:underline">
          Return to Up Only Fund home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
