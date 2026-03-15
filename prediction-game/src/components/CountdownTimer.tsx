import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date;
  size?: 'sm' | 'md' | 'lg';
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, size = 'md' }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          expired: false,
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const pad = (num: number) => num.toString().padStart(2, '0');

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-2',
    lg: 'text-lg gap-3',
  };

  const boxClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-lg',
    lg: 'px-4 py-3 text-2xl',
  };

  if (timeLeft.expired) {
    return (
      <div className={`flex items-center ${sizeClasses[size]}`}>
        <span className="text-muted-foreground font-medium">Expired</span>
      </div>
    );
  }

  const boxClass = `bg-secondary/80 backdrop-blur-sm rounded-lg font-mono font-bold border border-border/50 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_10px_hsl(187_80%_45%/0.2)] ${boxClasses[size]}`;

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      <Clock className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} text-primary transition-transform duration-300 animate-pulse`} />
      <div className="flex gap-1 items-center">
        {timeLeft.days > 0 && (
          <>
            <div className={boxClass}>{timeLeft.days}d</div>
            <span className="font-bold text-primary">:</span>
          </>
        )}
        <div className={boxClass}>{pad(timeLeft.hours)}</div>
        <span className="font-bold text-primary">:</span>
        <div className={boxClass}>{pad(timeLeft.minutes)}</div>
        <span className="font-bold text-primary">:</span>
        <div className={boxClass}>{pad(timeLeft.seconds)}</div>
      </div>
    </div>
  );
};

export default CountdownTimer;
