import { cn } from "@/lib/utils";
import type { BtcExchange, BtcInterval } from "@/lib/btcApi";
import { btcPillButtonClass, btcPillTrackClass } from "@/components/btc/btcStyles";

const EXCHANGES: { value: BtcExchange; label: string }[] = [
  { value: "binance", label: "Binance" },
  { value: "coinbase", label: "Coinbase" },
];

const BTC_INTERVALS: { value: BtcInterval; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1d", label: "1d" },
];

interface PillGroupProps<T extends string> {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
  ariaLabel: string;
}

function PillGroup<T extends string>({ value, options, onChange, className, ariaLabel }: PillGroupProps<T>) {
  return (
    <div className={cn(btcPillTrackClass, className)} role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={opt.value === value}
          onClick={() => onChange(opt.value)}
          className={btcPillButtonClass(opt.value === value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function BtcChartControls({
  exchange,
  interval,
  onExchangeChange,
  onIntervalChange,
  className,
}: {
  exchange: BtcExchange;
  interval: BtcInterval;
  onExchangeChange: (v: BtcExchange) => void;
  onIntervalChange: (v: BtcInterval) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <PillGroup
        value={exchange}
        options={EXCHANGES}
        onChange={onExchangeChange}
        ariaLabel="Exchange"
      />
      <PillGroup
        value={interval}
        options={BTC_INTERVALS}
        onChange={onIntervalChange}
        ariaLabel="Interval"
      />
    </div>
  );
}

export function BtcIntervalControls({
  interval,
  onIntervalChange,
  className,
}: {
  interval: BtcInterval;
  onIntervalChange: (v: BtcInterval) => void;
  className?: string;
}) {
  return (
    <PillGroup
      className={className}
      value={interval}
      options={BTC_INTERVALS}
      onChange={onIntervalChange}
      ariaLabel="Chart interval"
    />
  );
}
