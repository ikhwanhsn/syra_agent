const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-8">
      <div className="text-center max-w-full">
        <h1 className="mb-4 text-3xl sm:text-4xl font-bold">404</h1>
        <p className="mb-4 text-lg sm:text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90 touch-manipulation">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
