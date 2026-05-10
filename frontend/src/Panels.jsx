import {
  incidentMeta, resourceMeta, statusMeta, incidentStatusMeta,
  severityLabel, severityStyle, formatDuration,
} from "./constants.js"

/* ─────────────────────────────── IncidentPanel ─────────────────────────── */
export function IncidentPanel({ incidents, selectedId, setSelectedId }) {
  const active   = incidents.filter(i => i.status !== "RESOLVED")
  const resolved = incidents.filter(i => i.status === "RESOLVED")

  return (
    <aside className="flex min-h-0 flex-col border-r border-command-line bg-command-900/92">
      <div className="border-b border-command-line p-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚨</span>
          <div>
            <h2 className="text-xs font-bold text-white">Active Emergencies</h2>
            <p className="text-[10px] text-slate-500">Click any card to see it on the map</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
        {!active.length && (
          <div className="border border-dashed border-command-line bg-command-950/50 p-6 text-center rounded">
            <p className="text-2xl mb-2">🟢</p>
            <p className="text-sm font-semibold text-slate-300">No active emergencies</p>
            <p className="text-xs text-slate-500 mt-1">Click "Report Emergency" to begin</p>
          </div>
        )}

        {active.map(incident => {
          const meta   = incidentMeta[incident.type]
          const isSelected = selectedId === incident.id
          return (
            <button
              key={incident.id}
              onClick={() => setSelectedId(incident.id)}
              className={`w-full border p-3 text-left transition rounded ${
                isSelected ? "border-signal-cyan/60 bg-signal-cyan/10 shadow-glow" : "border-command-line bg-command-850/80 hover:border-slate-500/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{meta.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{incident.area_name}</p>
                    <p className="text-xs text-slate-400">{meta.label} · {incident.reported_at}</p>
                  </div>
                </div>
                <span className="border px-2 py-0.5 text-xs font-bold shrink-0 rounded" style={severityStyle(incident.severity)}>
                  {severityLabel(incident.severity)}
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-300">{incident.description}</p>

              <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                <span
                  className="border px-2 py-0.5 rounded font-semibold"
                  style={{ color: incidentStatusMeta[incident.status]?.color, borderColor: `${incidentStatusMeta[incident.status]?.color}44`, background: `${incidentStatusMeta[incident.status]?.color}10` }}
                >
                  {incidentStatusMeta[incident.status]?.label || incident.status}
                </span>
                {incident.status === "STABILIZING" && (
                  <span className="font-semibold text-signal-amber animate-shimmer">
                    Resolves in {formatDuration(incident.resolution_remaining_seconds)}
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>👥 {incident.people_affected}+ civilians at risk</span>
                {incident.units_involved?.length > 0 && (
                  <span>🚒 {incident.units_involved.length} unit{incident.units_involved.length > 1 ? "s" : ""} responding</span>
                )}
              </div>
            </button>
          )
        })}

        {/* Resolved section */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-widest text-slate-500">Resolved</p>
            <span className="text-xs text-signal-green">{resolved.length}</span>
          </div>
          {!resolved.length && (
            <div className="border border-dashed border-command-line bg-command-950/50 p-3 text-center rounded">
              <p className="text-xs text-slate-500">Resolved emergencies appear here</p>
            </div>
          )}
          <div className="space-y-2">
            {resolved.map(incident => (
              <button
                key={incident.id}
                onClick={() => setSelectedId(incident.id)}
                className="w-full border border-signal-green/25 bg-signal-green/10 p-3 text-left rounded hover:bg-signal-green/15 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{incident.area_name}</p>
                    <p className="text-xs text-slate-400">
                      {incidentMeta[incident.type]?.emoji} {incidentMeta[incident.type]?.label} · {incident.units_involved?.length || 0} units
                    </p>
                  </div>
                  <span className="border border-signal-green/35 bg-signal-green/10 px-2 py-0.5 text-[11px] font-bold text-signal-green rounded shrink-0">✅ RESOLVED</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  ⏱️ Resolved in {formatDuration(incident.resolved_duration_seconds)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

/* ─────────────────────────────── DispatchBoard ─────────────────────────── */
function dispatchTimeLabel(dispatch, incident) {
  const fmt = (s) => {
    if (!s || s <= 0) return "ARRIVED"
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
  }
  if (dispatch.status === "DISPATCHED") return "⏳ Preparing..."
  if (dispatch.status === "EN_ROUTE")   return `🕐 ETA ${fmt(dispatch.remaining_seconds)}`
  if (dispatch.status === "ON_SCENE") {
    if (incident?.status === "STABILIZING") return `⏳ Resolving ${fmt(incident.resolution_remaining_seconds)}`
    return "📍 On Scene"
  }
  if (dispatch.status === "RETURNING")  return `↩️ Return ${fmt(dispatch.return_remaining_seconds)}`
  return "✅ Done"
}

export function DispatchBoard({ resources, incidents, dispatches }) {
  const incidentLookup = Object.fromEntries(incidents.map(i => [i.id, i]))
  const resourceLookup = Object.fromEntries(resources.map(r => [r.id, r]))

  return (
    <div className="border-t border-command-line bg-command-950/95 p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Dispatch Board</p>
          <p className="text-xs font-semibold text-white">Live unit assignments & ETA countdown</p>
        </div>
        <span className="border border-signal-green/30 bg-signal-green/10 px-2 py-0.5 text-[11px] font-bold text-signal-green rounded">
          {dispatches.length} assigned
        </span>
      </div>

      {!dispatches.length && (
        <div className="border border-dashed border-command-line bg-command-950/50 p-4 text-center rounded">
          <p className="text-xs text-slate-500">No dispatches yet — click "🤖 Let AI Coordinate" to assign units</p>
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-3">
        {dispatches.slice(-9).map(dispatch => {
          const resource = resourceLookup[dispatch.resource_id]
          const incident = incidentLookup[dispatch.incident_id]
          if (!resource || !incident) return null
          const rm = resourceMeta[resource.type]
          const im = incidentMeta[incident.type]
          return (
            <div key={dispatch.id} className="border border-command-line bg-command-850/70 p-3 rounded">
              <div className="flex items-center gap-2">
                <span className="text-lg">{rm.emoji}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">{rm.label}</p>
                  <p className="text-[10px] text-slate-400 truncate">{resource.station_name}</p>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-signal-cyan truncate">
                → {im.emoji} {incident.area_name}
              </p>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span
                  className="border px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ color: statusMeta[dispatch.status]?.color, borderColor: `${statusMeta[dispatch.status]?.color}55`, background: `${statusMeta[dispatch.status]?.color}16` }}
                >
                  {statusMeta[dispatch.status]?.label || dispatch.status}
                </span>
                <span className="font-semibold text-white text-[11px]">{dispatchTimeLabel(dispatch, incident)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
