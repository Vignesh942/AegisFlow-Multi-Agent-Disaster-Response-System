import json
import os
from typing import Any

import httpx

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv():
        return None

load_dotenv()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"
MAX_RETRIES = 2


async def call_groq(prompt: str) -> dict[str, Any]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured — please check backend/.env")

    payload = {
        "model": MODEL,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an emergency coordination AI. Return only valid JSON, "
                    "with concise operational reasoning and no markdown."
                ),
            },
            {"role": "user", "content": prompt},
        ],
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=40) as client:
                response = await client.post(GROQ_URL, headers=headers, json=payload)
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]
                return json.loads(content)
        except httpx.TimeoutException as exc:
            last_error = exc
            # Retry once on timeout
            continue
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(f"Groq API returned error {exc.response.status_code}") from exc
        except (json.JSONDecodeError, KeyError) as exc:
            raise RuntimeError(f"Groq API returned unexpected response format: {exc}") from exc

    raise RuntimeError(f"Groq API timed out after {MAX_RETRIES} attempts") from last_error
