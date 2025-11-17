const BadgeStatus = ({
  type,
}: {
  type: "Pending" | "Active" | "Failed" | "Success";
}) => {
  return (
    <div
      className={`inline-block px-3 py-1.5 text-xs font-bold text-white rounded-full ${
        type === "Pending"
          ? "bg-yellow-500"
          : type === "Active"
          ? "bg-green-500"
          : type === "Failed"
          ? "bg-red-500"
          : "bg-blue-500"
      }`}
    >
      {type === "Success" ? "Profit" : type === "Failed" ? "Loss" : type}
    </div>
  );
};

export default BadgeStatus;
