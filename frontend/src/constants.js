export function formatDuration(seconds = 0) {
  const s = Math.max(0, Math.round(seconds || 0))
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`
}

export function formatEta(seconds) {
  if (!seconds || seconds <= 0) return "ARRIVED"
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

export const incidentMeta = {
  fire:     { label: "Fire",              emoji: "🔥", color: "#ff4d5e" },
  flood:    { label: "Flood",             emoji: "🌊", color: "#29d3c2" },
  medical:  { label: "Medical Emergency", emoji: "🏥", color: "#3ee47b" },
  collapse: { label: "Building Collapse", emoji: "🏚️", color: "#f6b73c" },
}

export const resourceMeta = {
  ambulance:   { label: "Ambulance",  emoji: "🚑", color: "#3ee47b", short: "AMB"    },
  fire_truck:  { label: "Fire Truck", emoji: "🚒", color: "#ff4d5e", short: "FIRE"   },
  rescue_team: { label: "Rescue",     emoji: "🪂", color: "#f6b73c", short: "RES"    },
}

export const statusMeta = {
  AVAILABLE:  { label: "Available",  color: "#3ee47b" },
  DISPATCHED: { label: "Dispatched", color: "#29d3c2" },
  EN_ROUTE:   { label: "En Route",   color: "#f6b73c" },
  ON_SCENE:   { label: "On Scene",   color: "#ff4d5e" },
  RETURNING:  { label: "Returning",  color: "#8bd3ff" },
}

export const incidentStatusMeta = {
  DETECTED:    { label: "Detected",        color: "#ff4d5e" },
  DISPATCHED:  { label: "Help On The Way", color: "#29d3c2" },
  EN_ROUTE:    { label: "Units Moving",    color: "#f6b73c" },
  ON_SCENE:    { label: "On Scene",        color: "#8bd3ff" },
  STABILIZING: { label: "Stabilizing",     color: "#f6b73c" },
  RESOLVED:    { label: "✅ Resolved",     color: "#3ee47b" },
}

export function severityLabel(s) {
  if (s >= 9) return "CRITICAL"
  if (s >= 7) return "HIGH"
  return "ELEVATED"
}

export function severityStyle(s) {
  if (s >= 9) return { color: "#ff4d5e", borderColor: "#ff4d5e55", background: "#ff4d5e14" }
  if (s >= 7) return { color: "#f6b73c", borderColor: "#f6b73c55", background: "#f6b73c14" }
  return       { color: "#29d3c2", borderColor: "#29d3c255", background: "#29d3c214" }
}
