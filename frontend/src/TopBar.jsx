import { useState } from "react"
import { Radio, Zap, Play, AlertTriangle, RotateCcw, HelpCircle } from "lucide-react"

export function WelcomeModal({ onStart, onDismiss }) {
  const [step, setStep] = useState(0)

  const steps = [
    {
      emoji: "🚨",
      title: "Report an Emergency",
      desc: 'Click "Report Emergency" to simulate a disaster event in Bangalore — fire, flood, building collapse, or medical crisis.',
    },
    {
      emoji: "🤖",
      title: "AI Takes Over",
      desc: 'Click "Let AI Coordinate" and watch 3 AI agents analyze the situation, find the nearest response units, and authorize dispatch — in seconds.',
    },
    {
      emoji: "🗺️",
      title: "Watch It Happen Live",
      desc: "Vehicles move on the map in real time. The right panel narrates exactly what each AI agent decided and why.",
    },
  ]

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="grid h-12 w-12 place-items-center rounded-full border border-signal-cyan/40 bg-signal-cyan/10 text-signal-cyan text-2xl">
            🛡️
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AegisFlow</h1>
            <p className="text-sm text-slate-400">AI-Powered Disaster Response Simulator</p>
          </div>
        </div>

        <p className="text-slate-300 text-sm leading-6 mb-6">
          Watch <strong className="text-white">three AI agents</strong> coordinate a real emergency response across Bangalore — analyzing incidents, allocating resources, and authorizing dispatch, all in real time.
        </p>

        {/* Steps */}
        <div className="space-y-3 mb-8">
          {steps.map((s, i) => (
            <div key={i} className={`modal-step transition-all duration-200 ${step === i ? "border-signal-cyan/40 bg-signal-cyan/5" : ""}`}>
              <div className="modal-step-num">{i + 1}</div>
              <div>
                <p className="text-sm font-semibold text-white">{s.emoji} {s.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onStart}
            className="flex-1 h-11 bg-signal-cyan/20 border border-signal-cyan/50 text-signal-cyan font-semibold text-sm hover:bg-signal-cyan/30 transition"
          >
            ▶ Start Demo
          </button>
          <button
            onClick={onDismiss}
            className="h-11 px-5 border border-command-line text-slate-400 text-sm hover:text-white hover:border-slate-500 transition"
          >
            Explore freely
          </button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-4">You can reopen this guide anytime using the ? button</p>
      </div>
    </div>
  )
}

export function HelpButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Open guide"
      className="inline-flex h-9 w-9 items-center justify-center border border-command-line text-slate-400 hover:text-white hover:border-slate-500 transition"
    >
      <HelpCircle size={16} />
    </button>
  )
}

const TONES = {
  red:   "border-signal-red/40   bg-signal-red/15   text-signal-red   hover:bg-signal-red/25",
  cyan:  "border-signal-cyan/40  bg-signal-cyan/15  text-signal-cyan  hover:bg-signal-cyan/25",
  amber: "border-signal-amber/40 bg-signal-amber/15 text-signal-amber hover:bg-signal-amber/25",
  muted: "border-command-line    bg-command-850     text-slate-300    hover:border-slate-500",
}

export function ControlButton({ icon: Icon, label, onClick, disabled, tone, tooltip }) {
  return (
    <div className="tooltip-wrap">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex h-11 items-center justify-center gap-2 border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${TONES[tone]}`}
      >
        <Icon size={15} />
        {label}
      </button>
      {tooltip && <span className="tooltip-text">{tooltip}</span>}
    </div>
  )
}

export function Metric({ icon: Icon, label, value, tone }) {
  const tones = {
    red:   "text-signal-red   border-signal-red/25   bg-signal-red/10",
    green: "text-signal-green border-signal-green/25 bg-signal-green/10",
    amber: "text-signal-amber border-signal-amber/25 bg-signal-amber/10",
  }
  return (
    <div className={`flex min-w-40 items-center gap-3 border px-3 py-2 ${tones[tone]}`}>
      <Icon size={18} />
      <div>
        <p className="text-xl font-semibold leading-5 text-white">{value}</p>
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
      </div>
    </div>
  )
}

export function TopBar({ incidents, resources, criticalCount, availableCount, isThinking, onTriggerIncident, onRunDispatch, onTriggerSecondary, onReset, onHelp }) {
  return (
    <header className="grid gap-3 border-b border-command-line bg-command-950/95 px-4 py-3 xl:grid-cols-[1fr_auto]">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 pr-4">
          <div className="grid h-10 w-10 place-items-center border border-signal-cyan/40 bg-signal-cyan/10 text-signal-cyan shadow-glow text-lg">
            🛡️
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-normal text-white">AegisFlow</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bangalore AI Emergency Coordinator</p>
          </div>
        </div>
        <Metric icon={() => <span className="text-base">🚨</span>} label="Active emergencies" value={incidents.length} tone="red" />
        <Metric icon={() => <span className="text-base">🚒</span>} label="Units available" value={`${availableCount}/${resources.length}`} tone="green" />
        <Metric icon={() => <span className="text-base">⚠️</span>} label="Critical alerts" value={criticalCount} tone="amber" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <ControlButton icon={Zap}          label="🚨 Report Emergency"      onClick={onTriggerIncident}  tone="red"   tooltip="Simulate a new disaster event in Bangalore" />
        <ControlButton icon={Play}         label="🤖 Let AI Coordinate"     onClick={onRunDispatch}      disabled={isThinking || !incidents.length} tone="cyan"  tooltip="AI analyzes & dispatches units automatically" />
        <ControlButton icon={AlertTriangle} label="⚡ Add Another Emergency" onClick={onTriggerSecondary} disabled={!incidents.length} tone="amber" tooltip="Test AI with multiple simultaneous incidents" />
        <ControlButton icon={RotateCcw}    label="🔄 Start Over"            onClick={onReset}            tone="muted" tooltip="Clear all incidents and reset the simulation" />
        <HelpButton onClick={onHelp} />
      </div>
    </header>
  )
}
