import { Calendar, MapPin } from 'lucide-react'
import { events } from '../data/dummyData'

const typeColors = {
  Conference: 'badge-accent',
  Launch: 'badge-green',
  Upgrade: 'badge-yellow',
}

export default function EventsCalendar() {
  return (
    <div className="panel h-full">
      <div className="panel-header">
        <div className="flex items-center gap-1">
          <Calendar size={10} />
          <span>Upcoming Events</span>
        </div>
        <span className="badge-accent">Calendar</span>
      </div>
      <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        {events.map((event, i) => (
          <div
            key={i}
            className="px-1.5 py-1 border-b border-terminal-border/20 hover:bg-terminal-accent/5 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0">
                <div className="text-[10px] text-terminal-text font-medium group-hover:text-terminal-accent transition-colors leading-tight">
                  {event.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-terminal-accent tabular-nums">{event.date}</span>
                  <span className="flex items-center gap-0.5 text-[9px] text-terminal-dim">
                    <MapPin size={7} />
                    {event.location}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`${typeColors[event.type]}`}>{event.type}</span>
                <span className="text-[9px] font-semibold text-terminal-accent">{event.ticker}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
