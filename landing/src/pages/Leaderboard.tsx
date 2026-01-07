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

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState("7d");
  const [sortConfig, setSortConfig] = useState({
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
          `https://api.syraa.fun/leaderboard?period=${timeFilter}`
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

  const totalWeeklyReward = 100; // Static for now

  // Sorting function
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((item) =>
      item.wallet.toLowerCase().includes(searchTerm.toLowerCase())
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
    currentPage * itemsPerPage
  );

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    );
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-muted-foreground">#{rank}</span>;
  };

  const getRewardPercentage = (rank) => {
    if (rank === 1) return "50%";
    if (rank === 2) return "30%";
    if (rank === 3) return "20%";
    return "-";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 opacity-30 grid-pattern" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 px-4 py-24 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 glass-card">
            <Trophy className="w-4 h-4 text-yellow-400" />
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
          className="flex items-center justify-center gap-4 mb-6"
        >
          <a
            href="/"
            className="px-6 py-3 text-sm font-medium transition-all rounded-lg glass-card hover:bg-primary/10 hover:border-primary/30"
          >
            ← Back to Home
          </a>
          <a
            href="https://www.x402scan.com/composer/agent/c543b43e-6f49-492d-9f8a-6b0cc273fb06/chat"
            target="_blank"
            className="px-6 py-3 text-sm font-medium transition-all rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Launch Agent →
          </a>
        </motion.div>

        {/* Reward Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 mb-8 glass-card rounded-2xl"
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
                ${totalWeeklyReward.toLocaleString()}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="px-4 py-3 text-center glass-card rounded-xl">
                <Trophy className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
                <div className="text-xs text-muted-foreground">1st Place</div>
                <div className="font-bold text-primary">50%</div>
              </div>
              <div className="px-4 py-3 text-center glass-card rounded-xl">
                <Medal className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                <div className="text-xs text-muted-foreground">2nd Place</div>
                <div className="font-bold text-primary">30%</div>
              </div>
              <div className="px-4 py-3 text-center glass-card rounded-xl">
                <Medal className="w-6 h-6 mx-auto mb-1 text-amber-600" />
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
              className="w-full py-3 pl-10 pr-4 transition-colors border-0 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Time Filter */}
          <div className="flex gap-2">
            {["7d", "14d", "30d", "all"].map((period) => (
              <button
                key={period}
                onClick={() => setTimeFilter(period)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  timeFilter === period
                    ? "bg-primary text-primary-foreground"
                    : "glass-card text-muted-foreground hover:text-foreground"
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
          className="overflow-hidden glass-card rounded-2xl"
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
                {paginatedData.map((item, index) => (
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(
                currentPage * itemsPerPage,
                filteredAndSortedData.length
              )}{" "}
              of {filteredAndSortedData.length} entries
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 transition-colors rounded-lg glass-card hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
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
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? "bg-primary text-primary-foreground"
                        : "glass-card hover:bg-primary/10"
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
                className="p-2 transition-colors rounded-lg glass-card hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        .grid-pattern {
          background-image: 
            linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .neon-text {
          background: linear-gradient(135deg, hsl(190, 100%, 50%), hsl(270, 100%, 65%));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        :root {
          --background: 220 15% 8%;
          --foreground: 210 20% 98%;
          --primary: 190 100% 50%;
          --neon-purple: 270 100% 65%;
          --muted-foreground: 215 20% 65%;
          --border: 215 15% 25%;
        }

        body {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
        }
      `}</style>
    </div>
  );
}
