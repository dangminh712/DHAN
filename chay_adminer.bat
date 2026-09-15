@echo off
chcp 65001 >nul
title Adminer Web DBMS (Port 8080)
echo ======================================================
echo    KHOI CHAY ADMINER WEB DBMS (127.0.0.1:8080)
echo ======================================================
cd /d "%~dp0server"
php -S 127.0.0.1:8080 -t adminer
pause
