import { ActivityFeed } from "./ActivityFeed"

function ThinkingDots() {
  return (
    <span className="thinking-dots ml-2">
      <span /><span /><span />
    </span>
  )
}

function StepBadge({ num, label, done, active }) {
  return (
    <div className={`flex items-center gap-2 p-3 border rounded transition-all ${
      done   ? "border-signal-green/40  bg-signal-green/10 text-signal-green" :
      active ? "border-signal-cyan/40   bg-signal-cyan/10  text-signal-cyan animate-pulse" :
               "border-command-line     bg-command-950/50  text-slate-500"
    }`}>
      <span className={`text-lg font-bold w-7 h-7 rounded-full border grid place-items-center text-xs ${
        done   ? "border-signal-green/50 bg-signal-green/15" :
        active ? "border-signal-cyan/50  bg-signal-cyan/15" :
                 "border-command-line    bg-command-850"
      }`}>{done ? "✓" : num}</span>
      <span className="text-xs font-semibold">{label}</span>
    </div>
  )
}

function NarrativeBlock({ icon, title, body, accent, show }) {
  if (!show) return null
  const colors = {
    red:   "border-signal-red/30   bg-signal-red/5   text-signal-red",
    cyan:  "border-signal-cyan/30  bg-signal-cyan/5  text-signal-cyan",
    amber: "border-signal-amber/30 bg-signal-amber/5 text-signal-amber",
  }
  return (
    <div className={`border rounded p-3 animate-fade-in-up ${colors[accent]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <p className="text-xs font-bold uppercase tracking-wide">{title}</p>
      </div>
      <p className="text-xs text-slate-300 leading-5">{body}</p>
    </div>
  )
}

export function NarratorPanel({ trace, isThinking, logs, dispatchCount, metrics }) {
  const incident  = trace?.incident_analysis
  const strategy  = trace?.strategy_plan
  const commander = trace?.commander_decision

  const hasDecision = Boolean(commander)
  const stepDone    = [Boolean(incident), Boolean(strategy), hasDecision]

  /* ── Metrics ── */
  const metricItems = [
    { label: "Emergencies Resolved", value: metrics.totalResolved, emoji: "✅" },
    { label: "Avg Response Time",    value: metrics.averageResponse  == null ? "—" : `${Math.floor(metrics.averageResponse/60)}m ${metrics.averageResponse%60}s`, emoji: "⏱️" },
    { label: "Units Active Now",     value: metrics.activeResources,  emoji: "🚒" },
    { label: "Fleet Utilisation",    value: `${metrics.utilization}%`, emoji: "📊" },
  ]

  return (
    <aside className="flex min-h-0 flex-col border-l border-command-line bg-command-900/92">
      {/* Header */}
      <div className="border-b border-command-line p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h2 className="text-sm font-bold text-white">AI Command Chain</h2>
            <p className="text-xs text-slate-500">Three agents working together</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 space-y-4">

        {/* Commander Decision Banner */}
        <section className={`border p-4 rounded transition-all ${hasDecision ? "border-signal-cyan/40 bg-signal-cyan/10 shadow-glow" : "border-command-line bg-command-850/60"}`}>
          <p className="text-[11px] uppercase tracking-widest text-signal-cyan font-semibold mb-1">Current Decision</p>
          <h3 className="text-base font-bold text-white leading-6">
            {isThinking
              ? <span className="flex items-center">Agents thinking live<ThinkingDots /></span>
              : hasDecision
                ? "✅ Dispatch Authorized"
                : "Waiting for your input"}
          </h3>
          {hasDecision && (
            <p className="mt-2 text-sm text-slate-300 leading-5">{commander.commander_intent}</p>
          )}
          {hasDecision && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-command-950/60 border border-command-line rounded p-2">
                <p className="text-[10px] text-slate-500 uppercase">Top Priority</p>
                <p className="text-sm font-semibold text-white mt-0.5">{commander.top_priority_incident || "—"}</p>
              </div>
              <div className="bg-command-950/60 border border-command-line rounded p-2">
                <p className="text-[10px] text-slate-500 uppercase">Units Deployed</p>
                <p className="text-sm font-semibold text-white mt-0.5">{dispatchCount}</p>
              </div>
            </div>
          )}
        </section>

        {/* 3-step flow */}
        <section>
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-2">How AI Responded</p>
          <div className="space-y-2">
            <StepBadge num="1" label="🔍 Scout AI — Ranked all incidents by danger" done={stepDone[0]} active={isThinking && !stepDone[0]} />
            <StepBadge num="2" label="📊 Strategy AI — Assigned nearest units"      done={stepDone[1]} active={isThinking && stepDone[0] && !stepDone[1]} />
            <StepBadge num="3" label="👨‍✈️ Commander AI — Authorized full dispatch"   done={stepDone[2]} active={isThinking && stepDone[1] && !stepDone[2]} />
          </div>
        </section>

        {/* Narrative blocks */}
        <NarrativeBlock
          icon="🔍" title="Scout AI Report" accent="red" show={Boolean(incident)}
          body={incident?.summary || ""}
        />
        <NarrativeBlock
          icon="📊" title="Strategy AI Report" accent="cyan" show={Boolean(strategy)}
          body={strategy?.summary + (strategy?.constraints?.length ? ` Note: ${strategy.constraints[0]}` : "") || ""}
        />
        {commander?.reasoning?.length > 0 && (
          <div className="border border-signal-amber/30 bg-signal-amber/5 rounded p-3 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">👨‍✈️</span>
              <p className="text-xs font-bold uppercase tracking-wide text-signal-amber">Commander's Reasoning</p>
            </div>
            <ul className="space-y-1.5">
              {commander.reasoning.map((r, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-300 leading-5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-signal-amber rounded-full" />
                  {typeof r === "string" ? r : JSON.stringify(r)}
                </li>
              ))}
            </ul>
            {commander.operator_note && (
              <div className="mt-3 border border-signal-amber/20 bg-command-950/50 rounded p-2 text-xs text-slate-200">
                📌 {commander.operator_note}
              </div>
            )}
          </div>
        )}

        {/* Metrics */}
        <section className="border border-command-line bg-command-850/60 rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest">Live Stats</p>
            <span className="text-[10px] text-signal-green border border-signal-green/30 bg-signal-green/10 px-2 py-0.5 rounded">LIVE</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {metricItems.map(({ label, value, emoji }) => (
              <div key={label} className="bg-command-950/50 border border-command-line rounded p-2">
                <p className="text-[10px] text-slate-500">{emoji} {label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Activity Feed */}
        <ActivityFeed logs={logs} />

        {/* Explainer */}
        <details className="border border-command-line rounded overflow-hidden">
          <summary className="px-4 py-3 text-xs font-semibold text-slate-400 cursor-pointer hover:text-white hover:bg-command-850/40 transition">
            ℹ️ How does the AI work?
          </summary>
          <div className="px-4 pb-4 pt-2 space-y-3 text-xs text-slate-400 leading-5">
            <p><strong className="text-signal-red">🔍 Scout Agent</strong> — Like a lookout. Reads all incident reports and ranks them by danger level, number of people at risk, and how fast the situation could get worse.</p>
            <p><strong className="text-signal-cyan">📊 Strategy Agent</strong> — Like a logistics planner. Finds the nearest available fire trucks, ambulances, and rescue teams for each incident — factoring in distance and unit capability.</p>
            <p><strong className="text-signal-amber">👨‍✈️ Commander Agent</strong> — Like a senior officer. Reviews the plan, checks for conflicts, and gives the final go-ahead for all dispatches with written reasoning.</p>
          </div>
        </details>

      </div>
    </aside>
  )
}
