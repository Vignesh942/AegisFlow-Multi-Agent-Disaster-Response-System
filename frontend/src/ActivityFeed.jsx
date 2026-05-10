import { useRef, useEffect } from "react"

const FEED_ICONS = {
  "INCIDENT DETECTED": "🚨",
  "INCIDENT UPDATE":   "📋",
  "NEW INCIDENT":      "⚡",
  "RESOURCE CONFLICT": "⚠️",
  "DISPATCH":          "🚀",
  "UNIT ARRIVED":      "📍",
  "SCENE UPDATE":      "🔧",
  "INCIDENT RESOLVED": "✅",
  "RESOURCE RECOVERY": "🔄",
  "CITY STATUS":       "🏙️",
  "SYSTEM READY":      "🟢",
  "SYSTEM":            "💻",
  "Incident Agent":    "🔍",
  "Strategy Agent":    "📊",
  "Commander Agent":   "👨‍✈️",
  "COMMAND":           "📡",
}

const FEED_CLASS = {
  "INCIDENT DETECTED": "feed-critical",
  "NEW INCIDENT":      "feed-critical",
  "INCIDENT RESOLVED": "feed-success",
  "RESOURCE RECOVERY": "feed-success",
  "CITY STATUS":       "feed-success",
}

const PLAIN_TAGS = {
  "INCIDENT DETECTED": "Emergency Reported",
  "INCIDENT UPDATE":   "Situation Update",
  "NEW INCIDENT":      "New Emergency",
  "RESOURCE CONFLICT": "Resource Gap",
  "DISPATCH":          "Unit Dispatched",
  "UNIT ARRIVED":      "Unit On Scene",
  "SCENE UPDATE":      "Field Update",
  "INCIDENT RESOLVED": "Emergency Resolved",
  "RESOURCE RECOVERY": "Unit Returning",
  "CITY STATUS":       "City Status",
  "SYSTEM READY":      "System Ready",
  "SYSTEM":            "System",
  "Incident Agent":    "Scout AI",
  "Strategy Agent":    "Strategy AI",
  "Commander Agent":   "Commander AI",
}

export function ActivityFeed({ logs }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs.length])

  return (
    <section className="border border-command-line bg-command-850/60 rounded overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-command-line">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">📡 Live Activity Feed</span>
        </div>
        <span className="h-2 w-2 animate-pulse bg-signal-green rounded-full" />
      </div>
      <div className="max-h-52 overflow-auto p-3 space-y-1">
        {logs.map((log, i) => {
          const icon = FEED_ICONS[log.tag] || "📌"
          const cls  = FEED_CLASS[log.tag]  || ""
          const tag  = PLAIN_TAGS[log.tag]  || log.tag
          return (
            <div key={`${log.time}-${i}`} className={`feed-entry ${cls}`} style={{ animationDelay: `${i * 10}ms` }}>
              <span className="text-base leading-5 shrink-0">{icon}</span>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-signal-cyan uppercase tracking-wide">{tag}</span>
                <span className="text-slate-500 text-[11px] ml-2">{log.time}</span>
                <p className="text-xs text-slate-300 leading-5 mt-0.5">{log.text}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </section>
  )
}
