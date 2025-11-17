import { useMutation, useQuery } from "@tanstack/react-query";
import { CreateSignalButtonNew } from "./CreateSignalButtonNew";
import toast from "react-hot-toast";
import { Button } from "../ui/button";

const SignalStatistic = () => {
  const { isPending, error, data } = useQuery({
    queryKey: ["repoDataSignalStatistic"],
    queryFn: () => fetch("/api/signal/statistic").then((res) => res.json()),
  });
  const dataPerformanceStatistics = [
    {
      title: "Total Signals",
      value: data?.totalSignals || "0",
    },
    {
      title: "Daily Signals",
      value: data?.dailySignals || "0",
    },
    {
      title: "Monthly Signals",
      value: data?.monthlySignals || "0",
    },
    {
      title: "Buy Signals",
      value: data?.buySignals || "0",
    },
    {
      title: "Sell Signals",
      value: data?.sellSignals || "0",
    },
    {
      title: "Active Signals",
      value: data?.activeSignals || "0",
    },
    {
      title: "Pending Signals",
      value: data?.pendingSignals || "0",
    },
    {
      title: "Failed Signals",
      value: data?.failedSignals || "0",
    },
    {
      title: "Success Signals",
      value: data?.successSignals || "0",
    },
    {
      title: "Total Win Rate",
      value: data?.totalWinRate || "0%",
    },
    {
      title: "Buy Win Rate",
      value: data?.buyWinRate || "0%",
    },
    {
      title: "Sell Win Rate",
      value: data?.sellWinRate || "0%",
    },
  ];

  return (
    <div className="bg-white pt-2 pb-4 rounded-md shadow-md min-h-[100px] max-w-7xl px-4 mx-3 xl:mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Signal Statistics</h1>
        <CreateSignalButtonNew />
      </div>
      <div className="md:flex items-center mt-3 gap-12 space-y-3 md:space-y-0">
        <div className="h-44 rounded-xl bg-gray-200 flex-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-x-32 md:gap-5 sm:gap-x-24 gap-x-12 flex-3/4">
          {dataPerformanceStatistics.map((item, index) => (
            <div className="flex items-center justify-between" key={index}>
              <p>{item.title}</p>
              <p>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SignalStatistic;
