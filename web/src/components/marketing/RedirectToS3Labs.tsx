import { useEffect, type ReactElement } from "react";

const S3LABS_ORIGIN = "https://s3labs.xyz";

type RedirectToS3LabsProps = {
  path?: string;
};

/** Full-page redirect to the S3 Labs website (hackathons and related programs live there). */
export function RedirectToS3Labs({ path = "/" }: RedirectToS3LabsProps): ReactElement {
  useEffect(() => {
    const suffix = path.startsWith("/") ? path : `/${path}`;
    window.location.replace(`${S3LABS_ORIGIN}${suffix}`);
  }, [path]);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Redirecting to S3 Labs…</p>
    </div>
  );
}
