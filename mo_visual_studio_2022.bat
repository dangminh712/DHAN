@echo off
chcp 65001 > nul
title Mở Visual Studio 2022 - DoAnKhoaHoc
echo ======================================================
echo    KHỞI ĐỘNG VISUAL STUDIO 2022 (VS TÍM)
echo ======================================================

set "DOTNET_ROOT=%USERPROFILE%\.dotnet"
set "DOTNET_ROOT(x64)=%USERPROFILE%\.dotnet"
set "DOTNET_MSBUILD_SDK_RESOLVER_CLI_DIR=%USERPROFILE%\.dotnet"
set "PATH=%USERPROFILE%\.dotnet;%PATH%"

set "VS_DEVENV=C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\devenv.exe"

if exist "%VS_DEVENV%" (
    echo Đang mở Visual Studio 2022 với dự án DoAnKhoaHoc.sln...
    start "" "%VS_DEVENV%" "%~dp0DoAnKhoaHoc.sln"
) else (
    echo Đang mở theo ứng dụng mặc định...
    start "" "%~dp0DoAnKhoaHoc.sln"
)
