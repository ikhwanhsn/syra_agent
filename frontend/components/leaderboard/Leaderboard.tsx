import { dataLeaderboard } from "@/data/dataLeaderboard";
import { AnimateIcon } from "../animate-ui/icons/icon";
import { SlidersHorizontal } from "../animate-ui/icons/sliders-horizontal";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/formatDate";
import toast from "react-hot-toast";

const dataHeader = [
  {
    label: "Rank",
    className: "w-[100px]",
  },
  {
    label: "Name",
    className: "text-center",
  },
  {
    label: "Total Signals",
    className: "text-center",
  },
  {
    label: "Win Rate",
    className: "text-center",
  },
  {
    label: "Buy Win Rate",
    className: "w-[100px] text-center",
  },
  {
    label: "Sell Win Rate",
    className: "text-center",
  },
  {
    label: "Last Active",
    className: "text-center",
  },
];

const Leaderboard = () => {
  const [valueSearch, setValueSearch] = useState("");
  const { isPending, error, data } = useQuery({
    queryKey: ["profileData", valueSearch],
    queryFn: () =>
      fetch(`/api/leaderboard?search=${valueSearch}`).then((res) => res.json()),
    placeholderData: [],
  });
  const handleInputSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueSearch(e.target.value);
  };

  return (
    <div className="bg-white py-2 rounded-md shadow-md min-h-[700px] max-w-7xl px-4 mx-3 xl:mx-auto mb-5">
      <div className="sm:flex items-center justify-between space-y-3 sm:space-x-0">
        <h1 className="text-2xl font-bold text-gray-800">Leaderboard</h1>
        <div className="flex items-center gap-2">
          <Input
            type="search"
            placeholder="Search user..."
            value={valueSearch}
            onChange={handleInputSearch}
            className="h-12 w-full sm:w-64 md:w-96 placeholder:text-base text-lg!"
          />
          <AnimateIcon
            animateOnHover
            onClick={() => toast.error(`Feature in development!`)}
            className="cursor-pointer border p-3 rounded-md"
          >
            <SlidersHorizontal size={24} />
          </AnimateIcon>
        </div>
      </div>
      <Table className="mt-3 rounded-xs overflow-hidden">
        <TableHeader>
          <TableRow className="bg-gray-100 text-base h-12">
            {dataHeader.map((item) => (
              <TableHead key={item.label} className={item.className}>
                {item.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.data?.map((item: any, index: number) => (
            <TableRow key={index} className="text-base h-12">
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell className="text-center">{item.username}</TableCell>
              <TableCell className="text-center">
                {item.totalSignals || 0}
              </TableCell>
              <TableCell className="text-center">
                {`${item.winRate?.toFixed(1)}%` || `-`}
              </TableCell>
              <TableCell className="w-[100px] text-center">
                {`${item.buyWinRate?.toFixed(1)}%` || `-`}
              </TableCell>
              <TableCell className="text-center">
                {`${item.sellWinRate?.toFixed(1)}%` || `-`}
              </TableCell>
              <TableCell className="text-center">
                {item.lastActive ? formatDate(item.lastActive) : `-`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Leaderboard;
