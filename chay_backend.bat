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
echo Dang chay .NET 8 Web API...
dotnet run
pause
