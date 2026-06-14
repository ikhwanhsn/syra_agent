import { useTheme } from "@/contexts/ThemeContext";

const METEOR_COUNT = 6;
const getRandom = (min: number, max: number) => Math.random() * (max - min) + min;

/** Pre-computed meteor configs – natural balance: not too many, not too few */
const meteorConfigs = Array.from({ length: METEOR_COUNT }, (_, i) => ({
  id: i,
  left: getRandom(5, 92),
  delay: getRandom(0, 26),
  duration: getRandom(14, 22),
  length: getRandom(70, 140),
  tilt: -24 + getRandom(-4, 4),
  opacity: getRandom(0.12, 0.26),
}));

export default function MeteorEffect() {
  const { theme } = useTheme();

  return (
    <div
      className="meteor-container"
      aria-hidden
    >
      {meteorConfigs.map((m) => (
        <div
          key={m.id}
          className="meteor"
          data-theme={theme}
          style={{
            left: `${m.left}%`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
            width: `${m.length}px`,
            ['--meteor-tilt' as string]: `${m.tilt}deg`,
            ['--meteor-opacity' as string]: m.opacity,
          }}
        />
      ))}
    </div>
  );
}
