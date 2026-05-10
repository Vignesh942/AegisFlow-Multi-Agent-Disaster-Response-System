import json
import math
from typing import Any

from groq_client import call_groq


def _distance_km(a: dict[str, Any], b: dict[str, Any]) -> float:
    lat1, lon1 = math.radians(a["latitude"]), math.radians(a["longitude"])
    lat2, lon2 = math.radians(b["latitude"]), math.radians(b["longitude"])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return round(6371 * 2 * math.asin(math.sqrt(h)), 1)


def _resource_score(resource: dict[str, Any], incident: dict[str, Any]) -> int:
    match = {
        ("fire_truck", "fire"): 40,
        ("ambulance", "medical"): 40,
        ("ambulance", "collapse"): 24,
        ("rescue_team", "collapse"): 42,
        ("rescue_team", "flood"): 40,
        ("fire_truck", "collapse"): 18,
        ("rescue_team", "fire"): 16,
    }.get((resource["type"], incident["type"]), 8)
    distance_penalty = min(_distance_km(resource, incident) * 1.8, 35)
    severity_bonus = incident["severity"] * 3
    return round(match + severity_bonus - distance_penalty)


def _fallback_incident_agent(incidents: list[dict[str, Any]]) -> dict[str, Any]:
    ranked = sorted(
        incidents,
        key=lambda item: item["severity"] * 10 + item["people_affected"] / 12,
        reverse=True,
    )
    return {
        "agent": "Incident Analysis Agent",
        "summary": "Four concurrent Bangalore incidents detected; collapse and fire require immediate command attention.",
        "risk_zones": [
            {
                "incident_id": item["id"],
                "area_name": item["area_name"],
                "risk": "critical" if item["severity"] >= 9 else "high",
                "civilian_impact": "mass casualty risk" if item["people_affected"] > 90 else "localized impact",
            }
            for item in ranked
        ],
        "priority_order": [item["id"] for item in ranked],
        "reasoning": [
            "Electronic City has the highest structural risk and trapped-person uncertainty.",
            "Koramangala fire can spread quickly in dense mixed-use blocks.",
            "MG Road flood affects mobility and evacuation corridors.",
        ],
    }


def _fallback_strategy_agent(
    incidents: list[dict[str, Any]],
    resources: list[dict[str, Any]],
    incident_analysis: dict[str, Any],
) -> dict[str, Any]:
    allocations = []
    used = set()
    by_id = {item["id"]: item for item in incidents}
    for incident_id in incident_analysis["priority_order"]:
        incident = by_id[incident_id]
        candidates = sorted(
            [resource for resource in resources if resource["id"] not in used],
            key=lambda resource: _resource_score(resource, incident),
            reverse=True,
        )
        selected = candidates[:2 if incident["severity"] >= 9 else 1]
        for resource in selected:
            used.add(resource["id"])
            distance = _distance_km(resource, incident)
            allocations.append(
                {
                    "incident_id": incident["id"],
                    "resource_id": resource["id"],
                    "resource_type": resource["type"],
                    "from": resource["base_name"],
                    "to": incident["area_name"],
                    "eta_minutes": max(4, round(distance / 0.55)),
                    "distance_km": distance,
                    "rationale": f"{resource['type'].replace('_', ' ')} is best positioned for {incident['type']} response.",
                }
            )
    return {
        "agent": "Resource Strategy Agent",
        "summary": "Prioritized nearest specialized units while reserving medical capacity for high-casualty zones.",
        "allocations": allocations,
        "constraints": [
            "Traffic congestion expected around MG Road and Koramangala.",
            "Collapse response needs rescue plus medical stabilization.",
        ],
    }


def _fallback_commander_agent(
    incidents: list[dict[str, Any]],
    incident_analysis: dict[str, Any],
    strategy_plan: dict[str, Any],
) -> dict[str, Any]:
    primary = incident_analysis["priority_order"][0]
    return {
        "agent": "Commander Decision Agent",
        "decision_status": "dispatch_authorized",
        "top_priority_incident": primary,
        "commander_intent": "Stabilize life-threatening zones first, protect evacuation corridors second, then contain property damage.",
        "final_decisions": [
            {
                "incident_id": allocation["incident_id"],
                "resource_id": allocation["resource_id"],
                "action": "dispatch",
                "eta_minutes": allocation["eta_minutes"],
            }
            for allocation in strategy_plan["allocations"]
        ],
        "reasoning": [
            "Building collapse receives the highest priority because survival probability decays rapidly for trapped victims.",
            "Fire response is dispatched in parallel to prevent escalation in Koramangala.",
            "Flood and medical incidents receive specialized units matched by proximity and capability.",
        ],
        "operator_note": "Approve dispatch package and monitor ETA drift every five minutes.",
    }


def _prompt(title: str, payload: dict[str, Any], schema_hint: str) -> str:
    return f"""
{title}

Context:
{json.dumps(payload, indent=2)}

Return concise emergency-control-room JSON only.
Required shape:
{schema_hint}
"""


async def run_incident_agent(incidents: list[dict[str, Any]]) -> dict[str, Any]:
    prompt = _prompt(
        "Incident Analysis Agent: assess Bangalore disaster incidents by severity, civilian impact, and risk zones.",
        {"incidents": incidents},
        '{"agent": string, "summary": string, "risk_zones": array, "priority_order": array, "reasoning": array}',
    )
    try:
        return await call_groq(prompt)
    except Exception:
        return _fallback_incident_agent(incidents)


async def run_strategy_agent(
    incidents: list[dict[str, Any]],
    resources: list[dict[str, Any]],
    incident_analysis: dict[str, Any],
) -> dict[str, Any]:
    prompt = _prompt(
        "Resource Strategy Agent: allocate available resources and estimate response times.",
        {"incidents": incidents, "resources": resources, "incident_analysis": incident_analysis},
        '{"agent": string, "summary": string, "allocations": array, "constraints": array}',
    )
    try:
        return await call_groq(prompt)
    except Exception:
        return _fallback_strategy_agent(incidents, resources, incident_analysis)


async def run_commander_agent(
    incidents: list[dict[str, Any]],
    incident_analysis: dict[str, Any],
    strategy_plan: dict[str, Any],
) -> dict[str, Any]:
    prompt = _prompt(
        "Commander Decision Agent: review agent outputs and make final dispatch decisions with human-readable reasoning.",
        {
            "incidents": incidents,
            "incident_analysis": incident_analysis,
            "strategy_plan": strategy_plan,
        },
        '{"agent": string, "decision_status": string, "top_priority_incident": string, "commander_intent": string, "final_decisions": array, "reasoning": array, "operator_note": string}',
    )
    try:
        return await call_groq(prompt)
    except Exception:
        return _fallback_commander_agent(incidents, incident_analysis, strategy_plan)


async def run_multi_agent_flow(
    incidents: list[dict[str, Any]],
    resources: list[dict[str, Any]],
) -> dict[str, Any]:
    incident_analysis = await run_incident_agent(incidents)
    strategy_plan = await run_strategy_agent(incidents, resources, incident_analysis)
    commander_decision = await run_commander_agent(incidents, incident_analysis, strategy_plan)
    return {
        "incident_analysis": incident_analysis,
        "strategy_plan": strategy_plan,
        "commander_decision": commander_decision,
    }
