"use client";

import AppProvider from "@/components/AppProvider";
import Leaderboard from "@/components/leaderboard/Leaderboard";

const LeaderboardPage = () => {
  return (
    <AppProvider>
      <Leaderboard />
    </AppProvider>
  );
};

export default LeaderboardPage;
