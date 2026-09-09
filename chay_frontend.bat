@echo off
chcp 65001 >nul
title Frontend React (Intranet)
echo ======================================================
echo    KHOI CHAY FRONTEND REACT (0.0.0.0:5173)
echo ======================================================

cd /d "%~dp0client"
echo Dang chay Vite Dev Server...
npm run dev
pause
