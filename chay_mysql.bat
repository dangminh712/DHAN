@echo off
chcp 65001 >nul
title MySQL Server 8.0 (Port 3307)
echo ======================================================
echo    KHOI CHAY MYSQL SERVER DI DONG (PORT 3307)
echo ======================================================

set "MYSQL_BIN=%USERPROFILE%\.cache\mysql-8.0.43-portable\mysql-8.0.43-winx64"
set "MYSQL_DATA=%USERPROFILE%\.cache\dhan-dbms-mysql-data"

if not exist "%MYSQL_BIN%\bin\mysqld.exe" (
    echo [LOI] Khong tim thay mysqld.exe tai: %MYSQL_BIN%\bin\mysqld.exe
    pause
    exit /b 1
)

echo Dang khoi dong MySQL tren 127.0.0.1:3307...
"%MYSQL_BIN%\bin\mysqld.exe" --no-defaults --basedir="%MYSQL_BIN%" --datadir="%MYSQL_DATA%" --port=3307 --bind-address=127.0.0.1 --mysqlx=OFF --console
pause
