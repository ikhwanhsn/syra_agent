"use client";

import AppProvider from "@/components/AppProvider";
import HistorySignal from "@/components/signals/HistorySignal";
import SignalStatistic from "@/components/signals/SignalStatistic";

const SignalsPage = () => {
  return (
    <AppProvider>
      <SignalStatistic />
      <HistorySignal />
    </AppProvider>
  );
};

export default SignalsPage;
