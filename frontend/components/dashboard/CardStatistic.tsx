import { Users } from "../animate-ui/icons/users";
import { Radio } from "../animate-ui/icons/radio";
import { Activity } from "../animate-ui/icons/activity";
import { Sparkles } from "../animate-ui/icons/sparkles";
import { AnimateIcon } from "../animate-ui/icons/icon";
import { useQuery } from "@tanstack/react-query";

const CardStatistic = () => {
  const { isPending, error, data } = useQuery({
    queryKey: ["repoDataStatistic"],
    queryFn: () => fetch("/api/dashboard/statistic").then((res) => res.json()),
  });

  const statisticData = [
    {
      icon: <Users className="text-blue-500" />,
      bgColor: "bg-blue-500/10",
      title: "Total Users",
      value: data?.totalUsers || "0",
    },
    {
      icon: <Radio className="text-purple-500" />,
      bgColor: "bg-purple-500/10",
      title: "Total Signals",
      value: data?.totalSignals || "0",
    },
    {
      icon: <Activity className="text-emerald-500" />,
      bgColor: "bg-emerald-500/10",
      title: "Signal Today",
      value: data?.signalToday || "0",
    },
    {
      icon: <Sparkles className="text-amber-500" />,
      bgColor: "bg-amber-500/10",
      title: "Avg Winrate",
      value: data?.avgWinrate || "0%",
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-3 xl:mx-auto ">
      <CardStatisticCustom {...statisticData[0]} />
      <CardStatisticCustom {...statisticData[1]} />
      <CardStatisticCustom {...statisticData[2]} />
      <CardStatisticCustom {...statisticData[3]} />
    </div>
  );
};

export default CardStatistic;

const CardStatisticCustom = ({
  icon,
  bgColor,
  title,
  value,
}: {
  icon: React.ReactNode;
  bgColor?: string;
  title: string;
  value: string;
}) => {
  return (
    <AnimateIcon
      animateOnHover
      className="flex items-center gap-3 bg-white p-4 rounded-md shadow-md min-h-[120px]"
    >
      <div
        className={`h-16 w-16 rounded-md ${
          bgColor || "bg-gray-300"
        } flex items-center justify-center`}
      >
        {icon}
      </div>
      <div>
        <h1 className="text-2xl font-bold">{value}</h1>
        <p>{title}</p>
      </div>
    </AnimateIcon>
  );
};
