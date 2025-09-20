@echo off
echo ========================================
echo    LOJIFY - Sistema de Estoque
echo ========================================
echo.

echo Iniciando servidor...
cd server
start "Lojify Server" cmd /k "node start.js"

echo.
echo Aguardando servidor inicializar...
timeout /t 3 /nobreak > nul

echo.
echo Iniciando cliente...
cd ..\client
start "Lojify Client" cmd /k "npm start"

echo.
echo ========================================
echo Sistema iniciado com sucesso!
echo.
echo Servidor: http://localhost:5000
echo Cliente:  http://localhost:3000
echo ========================================
echo.
pause
