@echo off
echo ========================================
echo INICIANDO SISTEMA DE ESTOQUE
echo ========================================
echo.

echo 1. Parando processos Node.js existentes...
taskkill /f /im node.exe >nul 2>&1

echo 2. Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo 3. Iniciando servidor backend...
cd server
start "Backend" cmd /k "npm run dev"

echo 4. Aguardando 5 segundos...
timeout /t 5 /nobreak >nul

echo 5. Iniciando frontend...
cd ../client
start "Frontend" cmd /k "npm start"

echo.
echo ========================================
echo SISTEMA INICIADO!
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Aguarde alguns segundos para os servidores carregarem...
echo.
pause 