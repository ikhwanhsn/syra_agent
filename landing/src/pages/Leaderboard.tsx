import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Medal,
  Gift,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LINK_AGENT } from "../../config/global";

type SortKey = "rank" | "wallet" | "volume" | "toolsCalls" | "totalReward";

export default function Leaderboard() {
  const [data, setData] = useState<Array<{
    wallet: string;
    volume: number;
    toolsCalls: number;
    totalReward: number;
    rank: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState("7d");
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "asc" | "desc";
  }>({
    key: "rank",
    direction: "asc",
  });
  const itemsPerPage = 10;

  // Fetch data from your API/MongoDB
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.syraa.fun/leaderboard?period=${timeFilter}`,
        );
        const result = await response.json();
        console.log("result", result);

        // Add rank based on volume (or your preferred metric)
        const rankedData = result
          .sort((a, b) => b.volume - a.volume)
          .map((item, index) => ({
            ...item,
            rank: index + 1,
          }));

        setData(rankedData);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeFilter]);

  const totalWeeklyReward: string | number = "-"; // Static for now

  // Sorting function
  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((item) =>
      item?.wallet?.toLowerCase()?.includes(searchTerm?.toLowerCase()),
    );

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [data, searchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    );
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 gold-text" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-warning" />;
    return <span className="text-muted-foreground">#{rank}</span>;
  };

  const getRewardPercentage = (rank: number) => {
    if (rank === 1) return "50%";
    if (rank === 2) return "30%";
    if (rank === 3) return "20%";
    return "-";
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* Background Effects - same as Index/HeroSection */}
      <div className="fixed inset-0 opacity-50 grid-pattern pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[100px] pointer-events-none" />

      <main className="relative z-10 pt-28 pb-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 glass-card">
              <Trophy className="w-4 h-4 gold-text" />
              <span className="text-sm text-muted-foreground">
                Powered by x402 Technology
              </span>
            </div>

            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
              <span className="neon-text">Leaderboard</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Compete with the best traders and earn rewards
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-8"
          >
            <a
              href="/"
              className="px-6 py-3 text-sm font-medium transition-all rounded-xl btn-secondary"
            >
              ← Back to Home
            </a>
            <a
              href={LINK_AGENT}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 text-sm font-medium btn-primary"
            >
              Launch Agent →
            </a>
          </motion.div>

          {/* Reward Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 mb-8 glass-card"
          >
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="text-center md:text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Weekly Reward Pool
                  </span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {typeof totalWeeklyReward === "number"
                    ? `$${totalWeeklyReward.toLocaleString()}`
                    : totalWeeklyReward}
                </div>
              </div>

            <div className="flex gap-4">
              <div className="px-4 py-3 text-center glass-card rounded-xl">
                <Trophy className="w-6 h-6 mx-auto mb-1 gold-text" />
                <div className="text-xs text-muted-foreground">1st Place</div>
                <div className="font-bold text-primary">50%</div>
              </div>
              <div className="px-4 py-3 text-center glass-card rounded-xl">
                <Medal className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">2nd Place</div>
                <div className="font-bold text-primary">30%</div>
              </div>
              <div className="px-4 py-3 text-center glass-card rounded-xl">
                <Medal className="w-6 h-6 mx-auto mb-1 text-warning" />
                <div className="text-xs text-muted-foreground">3rd Place</div>
                <div className="font-bold text-primary">20%</div>
              </div>
            </div>
          </div>
        </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between"
          >
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by wallet address..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-3 pl-10 pr-4 transition-colors border rounded-xl bg-background/80 border-border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            {/* Time Filter */}
            <div className="flex gap-2">
              {["7d", "14d", "30d", "all"].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeFilter(period)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                    timeFilter === period
                      ? "btn-primary"
                      : "btn-secondary"
                  }`}
                >
                  {period === "all" ? "All Time" : period.toUpperCase()}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="overflow-hidden glass-card"
          >
          <div className="relative z-10 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {[
                    { key: "rank", label: "Rank" },
                    { key: "wallet", label: "Wallet" },
                    { key: "volume", label: "Volume" },
                    { key: "toolsCalls", label: "Tools Calls" },
                    { key: "totalReward", label: "Total Reward" },
                  ].map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-4 text-xs font-medium text-left cursor-pointer text-muted-foreground hover:text-foreground"
                      onClick={() => handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        <SortIcon columnKey={column.key} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                      Loading leaderboard…
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                      No entries found.
                    </td>
                  </tr>
                ) : (
                paginatedData.map((item, index) => (
                  <motion.tr
                    key={item.wallet}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="transition-colors border-b border-border/30 hover:bg-primary/5"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(item.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-foreground">
                        {item.wallet}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-foreground">
                        ${item.volume.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-foreground">
                        {item.toolsCalls.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">
                          ${item.totalReward.toLocaleString()}
                        </span>
                        {item.rank <= 3 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                            {getRewardPercentage(item.rank)}
                          </span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(
                currentPage * itemsPerPage,
                filteredAndSortedData.length,
              )}{" "}
              of {filteredAndSortedData.length} entries
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 transition-colors rounded-xl border border-border bg-background/80 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[2.5rem] px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                      currentPage === pageNum
                        ? "btn-primary"
                        : "btn-secondary"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 transition-colors rounded-xl border border-border bg-background/80 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
