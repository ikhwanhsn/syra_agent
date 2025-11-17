"use client";

import AppProvider from "@/components/AppProvider";
import ATXPComponent from "@/components/insight/ATXP";

const InsightPage = () => {
  return (
    <AppProvider>
      <ATXPComponent />
    </AppProvider>
  );
};

export default InsightPage;
