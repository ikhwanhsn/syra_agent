const BadgeSignal = ({ type }: { type: "Buy" | "Sell" }) => {
  return (
    <div
      className={`inline-block px-3 py-1.5 text-xs font-bold text-white rounded-full ${
        type === "Buy" ? "bg-green-500" : "bg-red-500"
      }`}
    >
      {type}
    </div>
  );
};

export default BadgeSignal;
