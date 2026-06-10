@echo off
color 0A
echo ========================================================
echo   Subiendo el proyecto a tu GitHub automaticamente...
echo ========================================================
echo.

git init
git config user.email "bot@antigravity.ai"
git config user.name "Antigravity AI"
git add .
git commit -m "Init: Next.js + Supabase SSR + ChartJS dashboard"
git branch -M main
git remote add origin https://github.com/juanjogsv/SGI-Sistema-de-gesti-n-de-indicadores.git
git push -u origin main

echo.
echo ========================================================
echo   Proceso terminado. Ya deberias ver el codigo en la web.
echo   Presiona cualquier tecla para cerrar esta ventana...
echo ========================================================
pause >nul
