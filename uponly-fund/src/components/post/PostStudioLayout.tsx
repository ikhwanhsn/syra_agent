import { Outlet } from "react-router-dom";
import { PostStudioProvider } from "@/components/post/PostStudioProvider";

export function PostStudioLayout() {
  return (
    <PostStudioProvider>
      <Outlet />
    </PostStudioProvider>
  );
}
