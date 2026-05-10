@echo off
echo === AegisFlow Backend Starter ===
echo.

REM Kill any process using port 8000 so we don't get a port-in-use error
echo Checking for processes on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 "') do (
    echo Stopping existing process on port 8000 (PID %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

cd /d "%~dp0"

if not exist ".venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv .venv
)

call .venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt -q

echo.
echo Starting AegisFlow backend on http://localhost:8000
echo Press Ctrl+C to stop.
echo.

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
