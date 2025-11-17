import { useWallet } from "@solana/wallet-adapter-react";
import Avatar from "boring-avatars";
import { ButtonEditProfile } from "./ButtonEditProfile";
import { useQuery } from "@tanstack/react-query";

const Profile = () => {
  const { publicKey } = useWallet();
  const { isPending, error, data } = useQuery({
    queryKey: ["profileData", publicKey?.toBase58()],
    queryFn: () =>
      fetch(`/api/profile/read?wallet=${publicKey?.toBase58()}`).then((res) =>
        res.json()
      ),
  });
  const {
    isPending: isPendingStatistics,
    error: errorStatistics,
    data: dataStatistics,
  } = useQuery({
    queryKey: ["profileStatistics", publicKey?.toBase58()],
    queryFn: () =>
      fetch(`/api/profile/statistic?wallet=${publicKey?.toBase58()}`).then(
        (res) => res.json()
      ),
  });
  const dataPerformanceStatistics = [
    {
      title: "Total Signals",
      value: dataStatistics?.totalSignals || "0",
    },
    {
      title: "Daily Signals",
      value: dataStatistics?.dailySignals || "0",
    },
    {
      title: "Monthly Signals",
      value: dataStatistics?.monthlySignals || "0",
    },
    {
      title: "Buy Signals",
      value: dataStatistics?.buySignals || "0",
    },
    {
      title: "Sell Signals",
      value: dataStatistics?.sellSignals || "0",
    },
    {
      title: "Active Signals",
      value: dataStatistics?.activeSignals || "0",
    },
    {
      title: "Pending Signals",
      value: dataStatistics?.pendingSignals || "0",
    },
    {
      title: "Failed Signals",
      value: dataStatistics?.failedSignals || "0",
    },
    {
      title: "Success Signals",
      value: dataStatistics?.successSignals || "0",
    },
    {
      title: "Total Win Rate",
      value: dataStatistics?.totalWinRate || "-",
    },
    {
      title: "Buy Win Rate",
      value: dataStatistics?.buyWinRate || "-",
    },
    {
      title: "Sell Win Rate",
      value: dataStatistics?.sellWinRate || "-",
    },
  ];

  return (
    <div className="bg-white pt-2 pb-4 rounded-md shadow-md min-h-[100px] max-w-7xl px-4 mx-3 xl:mx-auto mb-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Your Profile</h1>
        <ButtonEditProfile />
      </div>
      <div className="sm:flex items-center mt-3 gap-3 space-y-3">
        <div className="flex items-center">
          {/* <div className="bg-gray-200 h-24 w-24 rounded-md"></div> */}
          <Avatar
            name={data?.user?.username || "default"}
            size={70}
            variant="beam"
          />
          <div className="ml-3 space-y-1">
            {isPending && (
              <div>
                <div className=" bg-gray-200 animate-pulse h-10 w-44 rounded-md"></div>
                <div className=" bg-gray-200 animate-pulse h-7 w-44 rounded-md mt-2"></div>
              </div>
            )}
            <h2 className="text-2xl font-bold text-gray-800">
              {data?.user?.username || ""}
            </h2>
            <p className="text-gray-600 text-lg">{data?.user?.email || ""}</p>
          </div>
        </div>
        <div className="text-center border px-3 py-2 rounded-md sm:w-52 sm:ml-12">
          <p className="font-semibold text-lg">Reputation</p>
          <p className="text-2xl font-bold text-gray-800">95</p>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mt-5">
        Performance Statistics
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-16 sm:gap-x-24 gap-y-3 mt-3">
        {dataPerformanceStatistics.map((item: any) => (
          <div className="flex items-center justify-between">
            <p>{item.title}</p>
            <p>{item.value}</p>
          </div>
        ))}
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mt-5">
        Win Rate Over Time
      </h1>
      <div className="bg-gray-200 w-full h-96 rounded-md mt-3"></div>
    </div>
  );
};

export default Profile;
