import { useMemo, useEffect } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Flame, Waves, Ambulance, Building2, Truck, ShieldCheck, MapPin } from "lucide-react"
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import { incidentMeta as _incidentMeta, resourceMeta as _resourceMeta, statusMeta, incidentStatusMeta } from "./constants.js"

const BANGALORE_CENTER = [12.9716, 77.5946]
const ROUTE_FADE_SECONDS = 5

// Extend with icon references for the map markers
const incidentMeta = {
  fire:     { ..._incidentMeta.fire,     icon: Flame     },
  flood:    { ..._incidentMeta.flood,    icon: Waves     },
  medical:  { ..._incidentMeta.medical,  icon: Ambulance },
  collapse: { ..._incidentMeta.collapse, icon: Building2 },
}
const resourceMeta = {
  ambulance:   { ..._resourceMeta.ambulance,   icon: Ambulance  },
  fire_truck:  { ..._resourceMeta.fire_truck,  icon: Truck      },
  rescue_team: { ..._resourceMeta.rescue_team, icon: ShieldCheck },
}

function markerIcon(kind, type, severity = 5, status = "AVAILABLE", incidentStatus = "DETECTED") {
  const meta        = kind === "incident" ? incidentMeta[type] : resourceMeta[type]
  const statusColor = statusMeta[status]?.color || meta?.color || "#29d3c2"
  const incidentColor = incidentStatus === "RESOLVED" ? "#3ee47b" : meta?.color || "#29d3c2"
  const Icon        = meta?.icon || MapPin
  const svg         = renderToStaticMarkup(<Icon size={kind === "incident" ? 18 : 22} strokeWidth={2.5} />)

  if (kind === "resource") {
    return L.divIcon({
      className: "",
      html: `<div class="resource-vehicle-marker" style="--marker-color:${meta?.color || "#29d3c2"};--status-color:${statusColor}">
        <span class="vehicle-icon">${svg}</span>
        <span class="vehicle-label">${resourceMeta[type]?.short || "UNIT"}</span>
        <span class="vehicle-status-dot"></span>
      </div>`,
      iconSize: [88, 40],
      iconAnchor: [44, 20],
    })
  }

  const size = 22 + severity * 1.8
  return L.divIcon({
    className: "",
    html: `<div class="incident-ring ${incidentStatus === "RESOLVED" ? "incident-resolved" : ""}" style="--marker-color:${incidentColor};width:${size}px;height:${size}px">
      <span>${svg}</span>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function MapRefocuser({ targetIncident }) {
  const map = useMap()
  useEffect(() => {
    if (targetIncident) {
      map.flyTo([targetIncident.latitude, targetIncident.longitude], 14, { duration: 1.2 })
    }
  }, [targetIncident?.id, map])
  return null
}

export function CommandMap({ incidents, resources, dispatches, selectedIncident, activeRoutes }) {
  const incidentLookup  = useMemo(() => Object.fromEntries(incidents.map(i => [i.id, i])), [incidents])
  const visibleResources = incidents.length ? resources : []

  const step1Done = incidents.length > 0
  const step2Done = dispatches.length > 0
  const step3Done = activeRoutes.length > 0

  return (
    <main className="relative flex-1 bg-command-950 min-h-[300px]">
      <MapContainer center={BANGALORE_CENTER} zoom={11.6} scrollWheelZoom className="h-full w-full min-h-[300px]">
        <MapRefocuser targetIncident={selectedIncident} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Incident zones */}
        {incidents.map(incident => (
          <Circle
            key={`${incident.id}-zone`}
            center={[incident.latitude, incident.longitude]}
            radius={incident.severity >= 9 ? 950 : 650}
            pathOptions={{
              color:       incident.status === "RESOLVED" ? "#3ee47b" : incidentMeta[incident.type].color,
              fillColor:   incident.status === "RESOLVED" ? "#3ee47b" : incidentMeta[incident.type].color,
              fillOpacity: incident.status === "RESOLVED" ? 0.04 : 0.08,
              opacity:     incident.status === "RESOLVED" ? 0.18 : 0.35,
            }}
          />
        ))}

        {/* Dispatch routes */}
        {dispatches.map(dispatch => {
          const incident = incidentLookup[dispatch.incident_id]
          if (!incident) return null
          const fadeOpacity = dispatch.route_status === "FADING"
            ? Math.max(0.08, ((dispatch.route_fade_remaining ?? ROUTE_FADE_SECONDS) / ROUTE_FADE_SECONDS) * 0.32)
            : 0.82
          return (
            <Polyline
              key={dispatch.id}
              className="dispatch-line"
              positions={[
                [dispatch.route.start.latitude, dispatch.route.start.longitude],
                [dispatch.route.end.latitude, dispatch.route.end.longitude],
              ]}
              pathOptions={{
                color:     dispatch.status === "RESOLVED" ? "#3ee47b" : incident.severity >= 9 ? "#ff4d5e" : "#29d3c2",
                weight:    incident.severity >= 9 ? 4 : 3,
                opacity:   dispatch.route_status === "FADING" ? fadeOpacity : dispatch.status === "ON_SCENE" ? 0.28 : 0.82,
                dashArray: "8 10",
              }}
            />
          )
        })}

        {/* Incident markers */}
        {incidents.map(incident => (
          <Marker
            key={incident.id}
            position={[incident.latitude, incident.longitude]}
            icon={markerIcon("incident", incident.type, incident.severity, "AVAILABLE", incident.status)}
          >
            <Popup>
              <strong>{incidentMeta[incident.type]?.emoji} {incident.area_name}</strong><br />
              {incidentMeta[incident.type]?.label}<br />
              Status: {incidentStatusMeta[incident.status]?.label}<br />
              👥 {incident.people_affected}+ civilians at risk
            </Popup>
          </Marker>
        ))}

        {/* Resource markers */}
        {visibleResources.map(resource => (
          <Marker
            key={resource.id}
            position={[resource.latitude, resource.longitude]}
            icon={markerIcon("resource", resource.type, 5, resource.status)}
          >
            <Popup>
              <strong>{resourceMeta[resource.type]?.emoji} {resourceMeta[resource.type]?.label}</strong><br />
              Base: {resource.station_name}<br />
              Status: {statusMeta[resource.status]?.label}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map legend overlay */}
      <div className="pointer-events-none absolute left-4 top-4 max-w-xs border border-command-line bg-command-950/90 px-4 py-3 shadow-glow backdrop-blur rounded">
        <p className="text-[10px] uppercase tracking-widest text-slate-400">Map Legend</p>
        <div className="mt-2 space-y-1.5 text-xs text-slate-300">
          {[
            { color: "#ff4d5e", label: "🔥 Fire incident / Fire truck" },
            { color: "#3ee47b", label: "🚑 Ambulance / Resolved" },
            { color: "#f6b73c", label: "🪂 Rescue team / En route" },
            { color: "#29d3c2", label: "🗺️ Active dispatch route" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 border rounded-sm" style={{ borderColor: color, background: `${color}33` }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>



      {/* Selected incident card */}
      {selectedIncident && (
        <div className="pointer-events-none absolute bottom-4 left-4 max-w-sm border border-signal-cyan/30 bg-command-950/92 p-4 backdrop-blur rounded">
          <p className="text-[10px] uppercase tracking-widest text-signal-cyan">Selected Emergency</p>
          <h2 className="mt-1 text-base font-bold text-white">
            {incidentMeta[selectedIncident.type]?.emoji} {selectedIncident.area_name}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-300">{selectedIncident.description}</p>
          <p className="mt-1 text-xs text-slate-400">👥 {selectedIncident.people_affected}+ civilians at risk</p>
        </div>
      )}
    </main>
  )
}
