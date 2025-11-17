"use client";

import { formatDate } from "@/lib/formatDate";
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
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import BadgeSignal from "../ui/BadgeSignal";
import BadgeStatus from "../ui/BadgeStatus";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const dataHeader = [
  {
    label: "Transaction",
    className: "w-[100px]",
  },
  {
    label: "Wallet",
    className: "w-[100px] text-center",
  },
  {
    label: "Signal",
    className: "text-center",
  },
  {
    label: "Token",
    className: "text-center",
  },
  {
    label: "Ticker",
    className: "text-center",
  },
  {
    label: "Current Price",
    className: "w-[100px] text-center",
  },
  {
    label: "Entry Price",
    className: "w-[100px] text-center",
  },
  {
    label: "Stop Loss",
    className: "text-center",
  },
  {
    label: "Take Profit",
    className: "text-center",
  },
  // {
  //   label: "Win Rate",
  //   className: "text-center",
  // },
  {
    label: "Status",
    className: "text-center",
  },
  {
    label: "Time",
    className: "text-center",
  },
];

const SignalExplorer = () => {
  const [valueSearch, setValueSearch] = useState("");
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [priceChanges, setPriceChanges] = useState<
    Record<
      string,
      {
        direction: "up" | "down" | "neutral";
        timestamp: number;
      }
    >
  >({});
  const { isPending, error, data } = useQuery({
    queryKey: ["repoDataSignal", valueSearch],
    queryFn: () =>
      fetch(`/api/signal/list?search=${valueSearch}`).then((res) => res.json()),
    placeholderData: [],
  });
  const {
    isPending: isPendingCryptoPrice,
    error: errorCryptoPrice,
    data: dataCryptoPrice,
  } = useQuery({
    queryKey: ["repoDataSignalCryptoPrice"],
    queryFn: () =>
      fetch(`http://212.85.25.26:3000/api/get-crypto-price`).then((res) =>
        res.json()
      ),
    refetchInterval: 3000,
  });
  // const {
  //   isPending: isPendingRefresh,
  //   error: errorRefresh,
  //   data: dataRefresh,
  // } = useQuery({
  //   queryKey: ["repoDataRefresh"],
  //   queryFn: async () => {
  //     if (!dataCryptoPrice) return null;

  //     const response = await fetch(`/api/signal/verified`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ prices: dataCryptoPrice }),
  //     });

  //     return response.json();
  //   },
  //   enabled: !!dataCryptoPrice, // Only run when prices are available
  //   refetchInterval: 60000, // Check every minute
  // });

  useEffect(() => {
    if (dataCryptoPrice && Object.keys(prevPrices).length > 0) {
      const changes: Record<
        string,
        { direction: "up" | "down" | "neutral"; timestamp: number }
      > = {};

      dataCryptoPrice.forEach((item: any) => {
        const currentPrice = parseFloat(item.price);
        const previousPrice = prevPrices[item.symbol];

        if (previousPrice && previousPrice !== currentPrice) {
          changes[item.symbol] = {
            direction: currentPrice > previousPrice ? "up" : "down",
            timestamp: Date.now(),
          };
        }
      });

      if (Object.keys(changes).length > 0) {
        setPriceChanges((prev) => ({ ...prev, ...changes }));

        // Reset colors after 2 seconds
        setTimeout(() => {
          setPriceChanges((prev) => {
            const updated = { ...prev };
            Object.keys(changes).forEach((symbol) => {
              if (updated[symbol]?.timestamp === changes[symbol].timestamp) {
                updated[symbol] = {
                  direction: "neutral",
                  timestamp: Date.now(),
                };
              }
            });
            return updated;
          });
        }, 1000);
      }
    }

    // Update previous prices
    if (dataCryptoPrice) {
      const newPrices: Record<string, number> = {};
      dataCryptoPrice.forEach((item: any) => {
        newPrices[item.symbol] = parseFloat(item.price);
      });
      setPrevPrices(newPrices);
    }
  }, [dataCryptoPrice]);

  const getPriceColorClass = (ticker: string) => {
    const symbol = `${ticker}USDT`;
    const change = priceChanges[symbol];

    if (!change || change.direction === "neutral") {
      return "text-gray-900 transition-colors duration-500";
    }

    return change.direction === "up"
      ? "text-green-600 transition-colors duration-300"
      : "text-red-600 transition-colors duration-300";
  };

  const handleInputSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueSearch(e.target.value);
  };

  return (
    <div className="bg-white py-2 pb-3 rounded-md shadow-md min-h-[500px] mt-3 mb-5 max-w-7xl px-4 mx-3 xl:mx-auto">
      <div className="sm:flex items-center justify-between space-y-3 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-800">Signal Explorer</h1>
        <div className="flex items-center gap-2">
          <Input
            type="search"
            placeholder="Search user, signal, data..."
            className="h-12 w-full sm:w-64 md:w-96 placeholder:text-base text-lg!"
            value={valueSearch}
            onChange={handleInputSearch}
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
          {isPending ? (
            // Show skeleton rows while loading
            <>
              {[...Array(10)].map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  {[...Array(10)].map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-5 bg-gray-200 rounded-md dark:bg-gray-700"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </>
          ) : data?.signals?.length === 0 ? (
            // Show error message if there is an error
            <TableRow>
              <TableCell colSpan={10} className="text-center">
                No signals found
              </TableCell>
            </TableRow>
          ) : (
            // Show real data after loading
            data?.signals?.map((item: any, index: number) => (
              <TableRow key={index} className="text-base h-12">
                <TableCell className="cursor-pointer hover:underline">
                  <Link
                    href={`https://explorer.solana.com/tx/${item.paymentSignature}?cluster=devnet`}
                    target="_blank"
                  >
                    {item.paymentSignature.slice(0, 13)}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  {item.wallet.slice(0, 5)}...{item.wallet.slice(-5)}
                </TableCell>
                <TableCell className="text-center">
                  <BadgeSignal type={item.signal} />
                </TableCell>
                <TableCell className="text-center">{item.token}</TableCell>
                <TableCell className="text-center">{item.ticker}</TableCell>
                <TableCell className="w-[100px] text-center font-semibold">
                  <span className={getPriceColorClass(item.ticker)}>
                    $
                    {Number(
                      dataCryptoPrice?.find(
                        (price: any) => price.symbol === `${item.ticker}USDT`
                      )?.price
                    ).toFixed(2) || "-"}
                  </span>
                </TableCell>
                <TableCell className="w-[100px] text-center">
                  ${item.entryPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  ${item.stopLoss.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  ${item.takeProfit.toFixed(2)}
                </TableCell>
                {/* <TableCell className="text-center">
                  {item.winRate || "-"}
                </TableCell> */}
                <TableCell className="text-center">
                  <BadgeStatus type={item.status} />
                </TableCell>
                <TableCell className="text-center">
                  {formatDate(item.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default SignalExplorer;
