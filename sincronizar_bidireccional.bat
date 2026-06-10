@echo off
color 0E
echo ========================================================
echo   Sincronizando con Lovable y GitHub...
echo ========================================================
echo.

:: 1. Traer cambios de Lovable
echo [1/3] Descargando cambios hechos en Lovable...
git pull origin main

:: 2. Guardar cambios locales
echo [2/3] Guardando cambios hechos en tu computador...
git add .
git commit -m "Sincronizacion bidireccional local-Lovable"

:: 3. Subir a GitHub
echo [3/3] Subiendo cambios a la nube...
git push origin main

echo.
echo ========================================================
echo   Sincronizacion completada con exito.
echo   Presiona cualquier tecla para cerrar esta ventana...
echo ========================================================
pause >nul
