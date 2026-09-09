@echo off
chcp 65001 >nul
title Kho Luu Tru Bai Giang Dien Tu T04
echo ======================================================
echo    DAI HOC AN NINH NHAN DAN - HE THONG BAI GIANG
echo ======================================================
echo 1. Khoi dong Backend .NET API (Cong 5000)...
start "Backend API (.NET 8)" cmd /k "%~dp0chay_backend.bat"

timeout /t 2 /nobreak > nul

echo 2. Khoi dong Frontend React (Cong 5173)...
start "Frontend (React)" cmd /k "%~dp0chay_frontend.bat"

echo.
echo ======================================================
echo Ca 2 dich vu da duoc khoi chay trong cua so rieng!
echo - Truy cap may nay:   http://localhost:5173
echo - Truy cap mang LAN:  Mo giao dien de xem IP noi bo!
echo ======================================================
pause
