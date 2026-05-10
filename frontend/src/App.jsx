import { useEffect, useMemo, useRef, useState } from "react"
import "./styles.css"
import { TopBar, WelcomeModal } from "./TopBar"
import { IncidentPanel, DispatchBoard } from "./Panels"
import { CommandMap } from "./CommandMap"
import { NarratorPanel } from "./NarratorPanel"

/* ─── Constants ─── */
const BANGALORE_CENTER = [12.9716, 77.5946]
const SIM_SECONDS_PER_TICK  = 12
const DISPATCH_PREP_SECONDS = 2
const ROUTE_FADE_SECONDS    = 5
const RESOURCE_RETURN_SECONDS = 18

const INCIDENT_TEMPLATES = [
  { type:"fire",    area_name:"Koramangala 5th Block",   latitude:12.9352, longitude:77.6245, severity:9,  people_affected:180, description:"Commercial kitchen fire spreading through a mixed-use block." },
  { type:"flood",   area_name:"MG Road",                 latitude:12.9756, longitude:77.6066, severity:7,  people_affected:260, description:"Severe waterlogging near metro exits with stranded commuters." },
  { type:"medical", area_name:"Whitefield",              latitude:12.9698, longitude:77.75,   severity:8,  people_affected:32,  description:"Multi-vehicle collision with trauma patients near ITPL approach." },
  { type:"collapse",area_name:"Electronic City Phase 1", latitude:12.8458, longitude:77.6603, severity:10, people_affected:95,  description:"Partial building collapse at construction site; trapped workers suspected." },
  { type:"fire",    area_name:"Indiranagar 100 Feet Rd", latitude:12.9784, longitude:77.6408, severity:8,  people_affected:110, description:"Electrical fire reported inside a dense retail lane." },
  { type:"medical", area_name:"HSR Layout Sector 2",     latitude:12.9121, longitude:77.6446, severity:7,  people_affected:24,  description:"Crowd crush and dehydration incident near community event." },
  { type:"flood",   area_name:"Yelahanka New Town",      latitude:13.1007, longitude:77.5963, severity:8,  people_affected:210, description:"Storm-water overflow blocking residential evacuation routes." },
]

const RESOURCE_STATIONS = [
  ...mkRes("AMB","ambulance",[
    ["Victoria Hospital",12.9635,77.5739],
    ["Vydehi Hospital Whitefield",12.9695,77.7499],
    ["Manipal Hospital Old Airport Rd",12.9584,77.6485],
    ["Fortis Bannerghatta",12.8947,77.5986],
    ["Aster CMI Hebbal",13.0506,77.5911],
    ["Columbia Asia Yeshwanthpur",13.0285,77.5395],
    ["Narayana HSR",12.9121,77.6446],
    ["Sakra Bellandur",12.9304,77.6784],
    ["Electronic City Medical",12.8458,77.6603],
    ["Jayanagar Trauma",12.925,77.5938],
  ]),
  ...mkRes("FIRE","fire_truck",[
    ["Indiranagar Fire Station",12.9784,77.6408],
    ["Jayanagar Fire Station",12.925,77.5938],
    ["Whitefield Fire Station",12.9698,77.75],
    ["Electronic City Fire Station",12.8458,77.6603],
    ["Yelahanka Fire Station",13.1007,77.5963],
    ["Hebbal Fire Station",13.0358,77.597],
    ["Koramangala Fire Station",12.9352,77.6245],
    ["Marathahalli Fire Station",12.9560,77.7010],
    ["Banashankari Fire Station",12.9250,77.5490],
    ["KR Puram Fire Station",13.0050,77.6960],
  ]),
  ...mkRes("RES","rescue_team",[
    ["Yelahanka NDRF Staging",13.1007,77.5963],
    ["HSR Layout Rescue",12.9121,77.6446],
    ["Electronic City Rescue",12.8458,77.6603],
    ["Hebbal Rapid Rescue",13.0358,77.597],
    ["Indiranagar Civil Defence",12.9784,77.6408],
    ["Whitefield SDRF Unit",12.9698,77.75],
  ]),
]

function mkRes(prefix, type, stations) {
  return stations.map(([station_name, latitude, longitude], i) => ({
    id: `${prefix}-${String(i+1).padStart(2,"0")}`, type, station_name,
    status:"AVAILABLE", latitude, longitude,
    home_latitude:latitude, home_longitude:longitude,
    availability:true, dispatch:null,
  }))
}

function cloneResources() { return RESOURCE_STATIONS.map(r => ({ ...r, dispatch:null })) }
function nowTime() { return new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"}) }
function randInt(a,b) { return Math.floor(Math.random()*(b-a+1))+a }

// Resolution time in simulated seconds (SIM_SECONDS_PER_TICK applied each real second)
function resolveDuration(type, severity) {
  const base = {medical:[90,180],fire:[240,420],flood:[360,720],collapse:[480,900]}[type]||[150,300]
  const multiplier = severity >= 9 ? 1.5 : severity >= 7 ? 1.2 : 1.0
  return Math.round(randInt(base[0], base[1]) * multiplier)
}

function distKm(a,b) {
  const r=v=>v*Math.PI/180, d=(x,y)=>Math.sin((r(y)-r(x))/2)**2
  return 6371*2*Math.asin(Math.sqrt(d(a.latitude,b.latitude)+Math.cos(r(a.latitude))*Math.cos(r(b.latitude))*d(a.longitude,b.longitude)))
}
function lerp(s,e,p) { return { latitude:s.latitude+(e.latitude-s.latitude)*p, longitude:s.longitude+(e.longitude-s.longitude)*p } }

// Smart dispatch rules — medical always gets a fire truck for extrication;
// floods and critical fires always include rescue teams
function requiredUnits(incident) {
  const { type, severity } = incident
  const isCritical = severity >= 9
  const isHigh     = severity >= 7
  const plans = {
    fire:     isCritical
                ? ["fire_truck","fire_truck","fire_truck","ambulance","rescue_team"]
                : isHigh
                  ? ["fire_truck","fire_truck","ambulance"]
                  : ["fire_truck","ambulance"],
    flood:    isCritical
                ? ["rescue_team","rescue_team","ambulance","fire_truck"]
                : ["rescue_team","ambulance","fire_truck"],
    medical:  isCritical
                ? ["ambulance","ambulance","fire_truck"]
                : ["ambulance","fire_truck"],
    collapse: isCritical
                ? ["rescue_team","rescue_team","ambulance","ambulance","fire_truck"]
                : ["rescue_team","ambulance","fire_truck"],
  }
  return plans[type] || ["ambulance","fire_truck"]
}

function sceneMsg(type) {
  return {
    medical:  "Patients triaged and stabilised. Fire crew assisted with vehicle extrication.",
    fire:     "Fire contained. Cooling operations underway. Ambulance on standby.",
    flood:    "Water ingress slowed. Rescue team clearing evacuation corridor.",
    collapse: "Void search complete. Rescue team extracting trapped individuals.",
  }[type] || "Scene stabilisation underway."
}

export default function App() {
  const [incidents,    setIncidents]   = useState([])
  const [resources,    setResources]   = useState(cloneResources)
  const [dispatches,   setDispatches]  = useState([])
  const [trace,        setTrace]       = useState(null)
  const [logs,         setLogs]        = useState([{ tag:"SYSTEM READY", text:"Welcome to AegisFlow! Click 'Report Emergency' to begin.", time:nowTime() }])
  const [selectedId,   setSelectedId]  = useState(null)
  const [isThinking,   setIsThinking]  = useState(false)
  const [incCounter,   setIncCounter]  = useState(0)
  const [showModal,    setShowModal]   = useState(true)
  const timersRef   = useRef([])
  const cityIdleRef = useRef(true)

  const selectedIncident = incidents.find(i => i.id === selectedId)
  const activeDispatches = dispatches.filter(d => d.status !== "COMPLETED")
  const visibleRoutes    = dispatches.filter(d => d.route_status !== "REMOVED" && d.status !== "COMPLETED")
  const activeRoutes     = visibleRoutes.filter(d => d.route_status === "ACTIVE")
  const activeIncidents  = incidents.filter(i => i.status !== "RESOLVED")
  const resolvedInc      = incidents.filter(i => i.status === "RESOLVED")
  const criticalCount    = activeIncidents.filter(i => i.severity >= 9).length
  const availableCount   = resources.filter(r => r.status === "AVAILABLE").length
  const activeResCount   = resources.filter(r => r.status !== "AVAILABLE").length

  const metrics = useMemo(() => {
    const rts = incidents.map(i=>i.response_time_seconds).filter(Number.isFinite)
    const res = resolvedInc.map(i=>i.resolved_duration_seconds).filter(Number.isFinite)
    return {
      totalResolved: resolvedInc.length,
      averageResponse: rts.length ? Math.round(rts.reduce((a,v)=>a+v,0)/rts.length) : null,
      fastestResolution: res.length ? Math.min(...res) : null,
      activeResources: activeResCount,
      utilization: Math.round((activeResCount/resources.length)*100),
    }
  },[activeResCount,incidents,resolvedInc,resources.length])

  function addLog(tag, text) { setLogs(cur => [...cur.slice(-80), { tag, text, time:nowTime() }]) }
  function queueLog(delay, tag, text) { const t=setTimeout(()=>addLog(tag,text),delay); timersRef.current.push(t) }
  function clearTimers() { timersRef.current.forEach(clearTimeout); timersRef.current=[] }

  function makeIncident(secondary=false) {
    const unused = INCIDENT_TEMPLATES.filter(t=>!incidents.some(i=>i.area_name===t.area_name))
    const pool = unused.length ? unused : INCIDENT_TEMPLATES
    const tmpl = pool[Math.floor(Math.random()*pool.length)]
    const id   = `INC-${String(incCounter+1).padStart(3,"0")}`
    const latJitter = (Math.random() > 0.5 ? 1 : -1) * (0.008 + Math.random() * 0.012)
    const lngJitter = (Math.random() > 0.5 ? 1 : -1) * (0.008 + Math.random() * 0.012)
    return { ...tmpl, id, sequence:incCounter+1, reported_at:nowTime(), status:"DETECTED",
      latitude: tmpl.latitude + latJitter, longitude: tmpl.longitude + lngJitter,
      is_secondary:secondary, detected_epoch:Date.now(), units_involved:[],
      resolution_total_seconds:null, resolution_remaining_seconds:null,
      response_time_seconds:null, resolved_duration_seconds:null, final_status:null }
  }

  function triggerIncident() {
    const inc = makeIncident(false)
    cityIdleRef.current = false
    setIncCounter(c=>c+1)
    setIncidents(cur=>[...cur, inc])
    setTrace(null)
    const typeLabels = { fire:"🔥 Fire", flood:"🌊 Flood", medical:"🏥 Medical Emergency", collapse:"🏚️ Building Collapse" }
    addLog("INCIDENT DETECTED", `${typeLabels[inc.type] || inc.type} reported at ${inc.area_name}`)
    queueLog(500, "INCIDENT UPDATE", `Severity: ${inc.severity >= 9 ? "CRITICAL" : inc.severity >= 7 ? "HIGH" : "ELEVATED"}. ~${inc.people_affected} civilians at risk.`)
    queueLog(1000,"INCIDENT UPDATE", `Now click "🤖 Let AI Coordinate" to dispatch response units.`)
  }

  function triggerSecondary() {
    const inc   = makeIncident(true)
    const busy  = resources.filter(r=>r.status!=="AVAILABLE").length
    cityIdleRef.current = false
    setIncCounter(c=>c+1)
    setIncidents(cur=>[...cur, inc])
    addLog("NEW INCIDENT", `⚡ New emergency at ${inc.area_name}!`)
    if (busy > 0) queueLog(450,"RESOURCE CONFLICT",`${busy} units already deployed. AI will find backup units.`)
    queueLog(900,"Commander Agent","Re-evaluating available units for dynamic reallocation...")
    const t = setTimeout(()=>runDispatch({ extraIncident:inc, realloc:true }), 1200)
    timersRef.current.push(t)
  }

  function pickResource(pool, neededType, incident) {
    const compat  = pool.filter(r=>r.type===neededType)
    const src     = compat.length ? compat : pool
    return [...src].sort((a,b)=>distKm(a,incident)-distKm(b,incident))[0]
  }

  function buildAllocations(incidentSet) {
    const activeDsp    = dispatches.filter(d=>d.status!=="COMPLETED")
    const assignedIds  = new Set(activeDsp.map(d=>d.incident_id))
    const lockedResIds = new Set(activeDsp.map(d=>d.resource_id))
    const targets      = incidentSet
      .filter(i=>i.status!=="RESOLVED" && !assignedIds.has(i.id))
      .sort((a,b)=>b.severity*100+b.people_affected-(a.severity*100+a.people_affected))
    const available    = resources.filter(r=>r.status==="AVAILABLE" && !lockedResIds.has(r.id) && !r.dispatch)
    const allocations  = []
    const conflicts    = []

    targets.forEach(incident => {
      requiredUnits(incident).forEach(neededType => {
        const sel = pickResource(available, neededType, incident)
        if (!sel) { conflicts.push(`No ${neededType.replace("_"," ")} available for ${incident.area_name}`); return }
        available.splice(available.findIndex(r=>r.id===sel.id), 1)
        const km  = distKm(sel, incident)
        const eta = Math.max(16, Math.min(42, Math.round(km*3.8)))
        allocations.push({
          id:`${sel.id}-${incident.id}`, resource_id:sel.id, resource_type:sel.type,
          incident_id:incident.id, destination:incident.area_name,
          eta_seconds:eta, remaining_seconds:eta, status:"DISPATCHED", route_status:"PENDING",
          route_fade_remaining:null, prep_remaining_seconds:DISPATCH_PREP_SECONDS,
          route:{ start:{latitude:sel.latitude,longitude:sel.longitude}, end:{latitude:incident.latitude,longitude:incident.longitude} },
        })
      })
    })
    return { allocations, conflicts, targets }
  }

  async function runDispatch(opts={}) {
    const incidentSet = opts.extraIncident ? [...incidents, opts.extraIncident] : incidents
    if (!incidentSet.length) { addLog("SYSTEM","No active emergencies to coordinate."); return }
    if (isThinking) return

    setIsThinking(true)
    setTrace(null)
    addLog("Incident Agent","🔍 Analyzing all active emergencies...")
    queueLog(700, "Incident Agent","Ranking by danger level, civilian impact, and spread risk.")
    queueLog(1400,"Strategy Agent","📊 Finding nearest available response units...")
    if (opts.realloc) queueLog(1900,"Strategy Agent","Units already deployed are locked. Checking backup stations...")
    queueLog(2400,"Commander Agent","👨‍✈️ Reviewing dispatch package for final authorization...")

    const startTime = Date.now()
    let apiData = null
    try {
      const activeDsp = dispatches.filter(d=>d.status!=="COMPLETED")
      const lockedResIds = new Set(activeDsp.map(d=>d.resource_id))
      const availableResources = resources.filter(r=>r.status==="AVAILABLE" && !lockedResIds.has(r.id) && !r.dispatch)
      
      const res = await fetch("http://localhost:8000/allocate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidents: incidentSet, resources: availableResources })
      })
      if (res.ok) apiData = await res.json()
    } catch (err) {
      console.warn("Groq API unavailable or failed, switching to local JS fallback simulation", err)
    }

    const elapsed = Date.now() - startTime
    const remainingDelay = Math.max(0, 3100 - elapsed)

    const t = setTimeout(() => {
      let allocations = []
      let conflicts = []
      let targets = incidentSet.filter(i=>i.status!=="RESOLVED")

      if (apiData && apiData.allocations && apiData.allocations.length > 0) {
          apiData.allocations.forEach(alloc => {
            const res = resources.find(r => r.id === alloc.resource_id)
            const inc = targets.find(i => i.id === alloc.incident_id)
            if (res && inc) {
                const km = distKm(res, inc)
                const eta = Math.max(16, Math.min(42, Math.round(km*3.8)))
                allocations.push({
                  id:`${res.id}-${inc.id}`, resource_id:res.id, resource_type:res.type,
                  incident_id:inc.id, destination:inc.area_name,
                  eta_seconds:eta, remaining_seconds:eta, status:"DISPATCHED", route_status:"PENDING",
                  route_fade_remaining:null, prep_remaining_seconds:DISPATCH_PREP_SECONDS,
                  route:{ start:{latitude:res.latitude,longitude:res.longitude}, end:{latitude:inc.latitude,longitude:inc.longitude} },
                })
            }
          })
          setTrace(apiData.agent_trace)
      } else {
          const fallback = buildAllocations(incidentSet)
          allocations = fallback.allocations
          conflicts = fallback.conflicts
          targets = fallback.targets
          const priorityOrder = [...incidentSet].sort((a,b)=>b.severity*100+b.people_affected-(a.severity*100+a.people_affected)).map(i=>i.id)
          setTrace({
            incident_analysis:{ summary:`${incidentSet.length} emergenc${incidentSet.length>1?"ies":"y"} assessed. Highest risk: ${priorityOrder[0]}.`, priority_order:priorityOrder, reasoning:["Severity and civilian impact are weighted first.","Already-deployed units remain committed to active incidents."] },
            strategy_plan:{ summary:`${allocations.length} units assigned. Each matched by type and proximity.`, allocations, constraints:conflicts.length?conflicts:["No resource conflicts detected."] },
            commander_decision:{ decision_status:"dispatch_authorized", top_priority_incident:priorityOrder[0], commander_intent:"Stabilize life-threatening zones first while preserving backup coverage across Bangalore.", reasoning:["Closest compatible available units dispatched first.","Already deployed units remain committed.",opts.realloc?"Backup resources selected for the new incident.":"Initial dispatch package authorized."], operator_note:"Monitor moving units and ETA countdowns until arrival." },
          })
      }

      conflicts.forEach(c=>addLog("RESOURCE CONFLICT",c))
      if (!allocations.length) { addLog("Commander Agent","⚠️ No available units remain. Escalation required."); setIsThinking(false); return }

      setDispatches(cur=>[...cur,...allocations])
      const targetIds = new Set(targets.map(i=>i.id))
      setIncidents(cur=>cur.map(i=> targetIds.has(i.id) ? { ...i, status:"DISPATCHED", units_involved:allocations.filter(a=>a.incident_id===i.id).map(a=>a.resource_id) } : i))
      setResources(cur=>cur.map(r=>{ const a=allocations.find(x=>x.resource_id===r.id); return a ? {...r,status:"DISPATCHED",availability:false,dispatch:{...a,progress:0}} : r }))

      addLog("Commander Agent",`✅ Dispatch authorized. ${allocations.length} unit${allocations.length>1?"s":""} now moving.`)
      targets.forEach(i=>addLog("DISPATCH",`Units heading to ${i.area_name} — ${i.type} response.`))

      const et = setTimeout(()=>{
        setIncidents(cur=>cur.map(i=>targetIds.has(i.id)&&i.status==="DISPATCHED"?{...i,status:"EN_ROUTE"}:i))
        setDispatches(cur=>cur.map(d=>targetIds.has(d.incident_id)&&d.status==="DISPATCHED"?{...d,status:"EN_ROUTE",route_status:"ACTIVE"}:d))
        setResources(cur=>cur.map(r=>r.dispatch&&targetIds.has(r.dispatch.incident_id)&&r.status==="DISPATCHED"?{...r,status:"EN_ROUTE",dispatch:{...r.dispatch,status:"EN_ROUTE",route_status:"ACTIVE"}}:r))
      }, 650)
      timersRef.current.push(et)
      setIsThinking(false)
    }, remainingDelay)
    timersRef.current.push(t)
  }

  function resetSimulation() {
    clearTimers()
    setIncidents([]); setResources(cloneResources()); setDispatches([]); setTrace(null)
    setSelectedId(null); setIsThinking(false); setIncCounter(0); cityIdleRef.current=true
    setLogs([{ tag:"SYSTEM READY", text:"Simulation reset. Click 'Report Emergency' to start again.", time:nowTime() }])
  }

  function handleModalStart() {
    setShowModal(false)
    setTimeout(()=>{ triggerIncident() }, 400)
  }

  /* ─── Simulation tick ─── */
  useEffect(()=>{
    if (cityIdleRef.current && dispatches.length === 0) return
    const timer = setTimeout(()=>{
      let nextRes = [...resources]
      let nextDisp = [...dispatches]
      let nextInc = [...incidents]

      const arrivals=[]; const returned=[]; const routeRemovals=[]
      
      nextRes = nextRes.map(r=>{
        if (!r.dispatch) return r
        if (r.status!=="EN_ROUTE"&&r.status!=="RETURNING") return r
        const remaining=Math.max(0,r.dispatch.remaining_seconds-1)
        const total=r.status==="RETURNING"?RESOURCE_RETURN_SECONDS:r.dispatch.eta_seconds
        const progress=Math.min(1,1-remaining/total)
        const pos=lerp(r.dispatch.route.start,r.dispatch.route.end,progress)
        
        if (remaining===0&&r.status==="EN_ROUTE") {
          arrivals.push({resource_id:r.id,incident_id:r.dispatch.incident_id,destination:r.dispatch.destination})
          return {...r,...pos,status:"ON_SCENE",dispatch:{...r.dispatch,remaining_seconds:0,progress:1,status:"ON_SCENE",route_status:"FADING",route_fade_remaining:ROUTE_FADE_SECONDS}}
        }
        if (remaining===0&&r.status==="RETURNING") {
          returned.push(r.id)
          return {...r,latitude:r.home_latitude,longitude:r.home_longitude,status:"AVAILABLE",availability:true,dispatch:null}
        }
        return {...r,...pos,dispatch:{...r.dispatch,remaining_seconds:remaining,progress,status:r.status}}
      })

      if (arrivals.length) {
        const arrivedIncIds=new Set(arrivals.map(a=>a.incident_id))
        nextDisp = nextDisp.map(d=>{
          const a=arrivals.find(x=>x.resource_id===d.resource_id&&x.incident_id===d.incident_id)
          if (a) return {...d,remaining_seconds:0,status:"ON_SCENE",route_status:"FADING",route_fade_remaining:ROUTE_FADE_SECONDS}
          if (d.status==="EN_ROUTE") return {...d,remaining_seconds:Math.max(0,d.remaining_seconds-1)}
          return d
        })
        arrivals.forEach(a=>addLog("UNIT ARRIVED",`${a.destination} — unit has arrived and is on scene.`))
        
        nextInc = nextInc.map(i=>{
          if (!arrivedIncIds.has(i.id)||i.status==="RESOLVED"||i.status==="STABILIZING"||i.status==="ON_SCENE") return i
          const dur=resolveDuration(i.type, i.severity)
          return {...i,status:"ON_SCENE",response_time_seconds:i.response_time_seconds??Math.round((Date.now()-i.detected_epoch)/1000),resolution_total_seconds:dur,resolution_remaining_seconds:dur}
        })
      } else {
        nextDisp = nextDisp.map(d=> d.status==="EN_ROUTE"?{...d,remaining_seconds:Math.max(0,d.remaining_seconds-1)}
          :d.status==="RETURNING"?{...d,return_remaining_seconds:Math.max(0,(d.return_remaining_seconds??RESOURCE_RETURN_SECONDS)-1)}:d)
      }

      nextDisp = nextDisp.map(d=>{
        if (d.route_status!=="FADING") return d
        const fade=Math.max(0,(d.route_fade_remaining??ROUTE_FADE_SECONDS)-1)
        if (fade===0){routeRemovals.push(d.id);return{...d,route_status:"REMOVED",route_fade_remaining:0}}
        return {...d,route_fade_remaining:fade}
      }).filter(d=>d.status!=="COMPLETED")

      if (routeRemovals.length) {
        nextRes = nextRes.map(r=>r.dispatch&&routeRemovals.includes(r.dispatch.id)?{...r,dispatch:{...r.dispatch,route_status:"REMOVED",route_fade_remaining:0}}:r)
      }

      if (returned.length) {
        returned.forEach(rid=>addLog("RESOURCE RECOVERY",`Unit returning to station and now available.`))
        nextDisp = nextDisp.filter(d=>!returned.includes(d.resource_id))
      }

      const resolvedEvs=[]
      nextInc = nextInc.map(i=>{
        if (i.status!=="STABILIZING") return i
        const rem=Math.max(0,i.resolution_remaining_seconds-SIM_SECONDS_PER_TICK)
        if (rem>0) return {...i,resolution_remaining_seconds:rem}
        const dur=i.resolution_total_seconds||0
        resolvedEvs.push({incident_id:i.id,area_name:i.area_name,type:i.type,duration:dur,units:i.units_involved||[]})
        return {...i,status:"RESOLVED",resolution_remaining_seconds:0,resolved_duration_seconds:dur,final_status:"RESOLVED"}
      })

      if (resolvedEvs.length) {
        const typeLabels={fire:"🔥 Fire",flood:"🌊 Flood",medical:"🏥 Medical",collapse:"🏚️ Collapse"}
        resolvedEvs.forEach(ev=>{
          const mins=Math.floor(ev.duration/60), secs=ev.duration%60
          addLog("INCIDENT RESOLVED",`✅ ${typeLabels[ev.type]||ev.type} at ${ev.area_name} resolved in ${mins}m ${secs}s.`)
          addLog("RESOURCE RECOVERY","Units are returning to their stations.")
        })
        const resolvedIds=new Set(resolvedEvs.map(e=>e.incident_id))
        nextDisp = nextDisp.map(d=>resolvedIds.has(d.incident_id)?{...d,status:"RETURNING",route_status:"REMOVED",route_fade_remaining:0,remaining_seconds:0,return_remaining_seconds:RESOURCE_RETURN_SECONDS}:d)
        nextRes = nextRes.map(r=>{
          if (!r.dispatch||!resolvedIds.has(r.dispatch.incident_id)) return r
          return {...r,status:"RETURNING",dispatch:{...r.dispatch,status:"RETURNING",route_status:"REMOVED",route_fade_remaining:0,remaining_seconds:RESOURCE_RETURN_SECONDS,route:{start:{latitude:r.latitude,longitude:r.longitude},end:{latitude:r.home_latitude,longitude:r.home_longitude}}}}
        })
      }

      nextInc = nextInc.map(i => {
         if (i.status === "ON_SCENE") {
             if (i.on_scene_ticks === undefined) return { ...i, on_scene_ticks: 1 }
             if (i.on_scene_ticks >= 1) {
                 addLog("SCENE UPDATE",sceneMsg(i.type))
                 return { ...i, status: "STABILIZING" }
             }
             return { ...i, on_scene_ticks: i.on_scene_ticks + 1 }
         }
         return i
      })

      setResources(nextRes)
      setDispatches(nextDisp)
      setIncidents(nextInc)
    }, 1000)
    return ()=>clearTimeout(timer)
  }, [resources, dispatches, incidents])

  /* City idle watcher */
  useEffect(()=>{
    if (incidents.length>0&&activeIncidents.length===0&&activeResCount===0&&!cityIdleRef.current) {
      addLog("CITY STATUS","🏙️ All emergencies resolved. Bangalore is safe.")
      addLog("SYSTEM READY","Ready for the next scenario!")
      setTrace(null)
      setDispatches(cur=>cur.filter(d=>d.status!=="COMPLETED"&&d.status!=="RETURNING"))
      cityIdleRef.current=true
    }
  },[activeIncidents.length,activeResCount,incidents.length])

  useEffect(()=>()=>clearTimers(),[])

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-command-950 text-slate-200" style={{minHeight:"100dvh"}}>
      {showModal && <WelcomeModal onStart={handleModalStart} onDismiss={()=>setShowModal(false)} />}

      <TopBar
        incidents={activeIncidents}
        resources={resources}
        criticalCount={criticalCount}
        availableCount={availableCount}
        isThinking={isThinking}
        onTriggerIncident={triggerIncident}
        onRunDispatch={()=>runDispatch()}
        onTriggerSecondary={triggerSecondary}
        onReset={resetSimulation}
        onHelp={()=>setShowModal(true)}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(360px,1fr)_320px] xl:grid-cols-[310px_minmax(400px,1fr)_360px]">
        <IncidentPanel incidents={incidents} selectedId={selectedId} setSelectedId={setSelectedId} />

        <div className="flex min-h-0 flex-col">
          <CommandMap
            incidents={incidents}
            resources={resources}
            dispatches={visibleRoutes}
            selectedIncident={selectedIncident}
            activeRoutes={activeRoutes}
          />
          <DispatchBoard resources={resources} incidents={incidents} dispatches={activeDispatches} />
        </div>

        <NarratorPanel
          trace={trace}
          isThinking={isThinking}
          logs={logs}
          dispatchCount={activeDispatches.length}
          metrics={metrics}
        />
      </div>
    </div>
  )
}
