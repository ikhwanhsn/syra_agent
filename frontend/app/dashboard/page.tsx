"use client";

import AppProvider from "@/components/AppProvider";
import CardStatistic from "@/components/dashboard/CardStatistic";
import SignalExplorer from "@/components/dashboard/SignalExplorer";

const DashboardPage = () => {
  return (
    <AppProvider>
      <CardStatistic />
      <SignalExplorer />
    </AppProvider>
  );
};

export default DashboardPage;
