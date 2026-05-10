@echo off
setlocal
set APIPORT=%1
if "%APIPORT%"=="" set APIPORT=8000
set VITE_API_BASE=http://localhost:%APIPORT%

cd /d "%~dp0frontend"
if not exist ".env" if exist ".env.example" copy /Y ".env.example" ".env" >nul

echo Using API base: %VITE_API_BASE%
echo Starting frontend at http://localhost:5173
npm run dev
