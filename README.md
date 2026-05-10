# AegisFlow

AegisFlow is a 24-hour hackathon MVP for a multi-agent AI disaster response and resource coordination system focused on Bangalore city. It presents a dark emergency command center dashboard where concurrent fire, flood, medical, and collapse incidents are analyzed by collaborating AI agents before a final dispatch decision is visualized on a live map.

## Architecture

- **Frontend:** React + Vite + Tailwind CSS + Leaflet/OpenStreetMap
- **Backend:** Python FastAPI
- **AI:** Groq OpenAI-compatible API using `llama-3.3-70b-versatile`
- **Database:** SQLite seeded with realistic Bangalore incidents and resources

Agent flow:

1. Incident Analysis Agent evaluates severity, civilian impact, and risk zones.
2. Resource Strategy Agent maps available ambulances, fire trucks, and rescue teams to incidents.
3. Commander Decision Agent reviews the previous outputs and authorizes final dispatch decisions.

Each agent has a separate prompt and exchanges structured JSON with the next step.

## Project Structure

```text
backend/
  agents.py
  data.py
  database.py
  .env.example
  groq_client.py
  main.py
  requirements.txt
frontend/
  .env.example
  src/
    App.jsx
    api.js
    main.jsx
    styles.css
  package.json
  tailwind.config.js
  vite.config.js
start-backend.ps1
start-frontend.ps1
README.md
```

## Quick Start With Docker (Recommended)

Prerequisite: install [Docker Desktop](https://www.docker.com/products/docker-desktop/).

From the project root:

```powershell
copy backend\.env.example backend\.env
# edit backend\.env and set GROQ_API_KEY
docker compose up --build
```

Then open `http://localhost:5173`.

Useful commands:

```powershell
docker compose down
docker compose up -d
docker compose logs -f
```

## Quick Start (Windows PowerShell, No Docker)

Open two terminals at the project root:

Terminal 1 (backend):

```powershell
.\start-backend.ps1
```

Terminal 2 (frontend):

```powershell
.\start-frontend.ps1
```

Open `http://localhost:5173`.

If PowerShell blocks scripts, use:

```cmd
start-backend.cmd
start-frontend.cmd
```

## Backend Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn main:app --reload
```

The API runs at `http://localhost:8000`.

Endpoints:

- `GET /incidents`
- `GET /resources`
- `POST /analyze`
- `POST /allocate`

## Groq API Setup

Create `backend/.env` or set the environment variable:

```bash
GROQ_API_KEY=your_groq_api_key_here
```

The backend calls:

- URL: `https://api.groq.com/openai/v1/chat/completions`
- Model: `llama-3.3-70b-versatile`

If no key is configured, AegisFlow uses deterministic fallback decisions so the dashboard remains demo-ready.

## Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Demo Flow

1. Start FastAPI.
2. Start Vite.
3. Open the dashboard.
4. Click **Run agent dispatch**.
5. Watch incidents, resource markers, dispatch lines, agent reasoning, and commander decisions update together.

## Screenshots

Add screenshots here after running the app:

- Dashboard overview
- Bangalore incident map
- AI command chain reasoning
- Final dispatch decision
