"use client";

import AppProvider from "@/components/AppProvider";
import Profile from "@/components/profile/Profile";

const ProfilePage = () => {
  return (
    <AppProvider>
      <Profile />
    </AppProvider>
  );
};

export default ProfilePage;
