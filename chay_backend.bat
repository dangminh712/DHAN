@echo off
chcp 65001 >nul
title Backend .NET 8 Web API (Intranet)
echo ======================================================
echo    KHOI CHAY BACKEND .NET 8 (0.0.0.0:5000)
echo ======================================================

set "DOTNET_ROOT=%USERPROFILE%\.dotnet"
set "DOTNET_ROOT(x64)=%USERPROFILE%\.dotnet"
set "DOTNET_MSBUILD_SDK_RESOLVER_CLI_DIR=%USERPROFILE%\.dotnet"
set "PATH=%USERPROFILE%\.dotnet;%PATH%"
set "DOTNET_CLI_TELEMETRY_OPTOUT=1"

cd /d "%~dp0server"

netstat -ano | findstr ":3307" >nul
if %errorlevel% neq 0 (
    if exist "%USERPROFILE%\.cache\mysql-8.0.43-portable\mysql-8.0.43-winx64\bin\mysqld.exe" (
        echo [CSDL] Phat hien MySQL port 3307 chua chay. Dang tu dong bat MySQL di dong...
        start "MySQL Server (Port 3307)" /min "%USERPROFILE%\.cache\mysql-8.0.43-portable\mysql-8.0.43-winx64\bin\mysqld.exe" --no-defaults --basedir="%USERPROFILE%\.cache\mysql-8.0.43-portable\mysql-8.0.43-winx64" --datadir="%USERPROFILE%\.cache\dhan-dbms-mysql-data" --port=3307 --bind-address=127.0.0.1 --mysqlx=OFF --console
        timeout /t 2 /nobreak >nul
    )
)

netstat -ano | findstr ":5000" >nul
if %errorlevel% equ 0 (
    echo [THONG BAO] Port 5000 dang duoc su dung boi mot tien trinh cu.
    echo Dang giai phong Server.exe cu de khoi dong lai sach se...
    taskkill /F /IM Server.exe >nul 2>&1
    timeout /t 1 /nobreak >nul
)

echo Dang chay .NET 8 Web API...
dotnet run
pause
