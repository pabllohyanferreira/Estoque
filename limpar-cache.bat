@echo off
echo 🧹 Limpando cache e reiniciando sistema...

echo.
echo ⏹️ Parando processos Node.js...
taskkill /f /im node.exe 2>nul

echo.
echo 🗑️ Limpando cache do cliente...
cd client
if exist node_modules rmdir /s /q node_modules
if exist .next rmdir /s /q .next
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
if exist .env.local del .env.local
if exist .env del .env

echo.
echo 🗑️ Limpando cache do servidor...
cd ..\server
if exist node_modules rmdir /s /q node_modules

echo.
echo 📦 Reinstalando dependências...
cd ..\client
call npm install

cd ..\server
call npm install

echo.
echo 🔄 Reiniciando sistema...
cd ..
start-simple.bat

echo.
echo ✅ Sistema reiniciado! Limpe o cache do navegador (Ctrl+F5)
pause
