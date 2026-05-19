@echo off
start "Backend Server" cmd /k "cd backend && .\venv\Scripts\python.exe -m uvicorn main:app --reload"
start "Frontend Server" cmd /k "npm.cmd run dev"