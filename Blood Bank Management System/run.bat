@echo off
echo Compiling Blood Bank Management System...
cd /d "%~dp0backend"
if not exist out mkdir out
javac -d out src/model/*.java src/service/*.java src/server/*.java src/Main.java
if %errorlevel% neq 0 (
    echo Compilation FAILED. Make sure JDK 11+ is installed and on your PATH.
    pause
    exit /b 1
)
echo Compilation successful!
echo.
echo Starting server on http://localhost:8080 ...
echo Open frontend\index.html in your browser.
echo Press Ctrl+C to stop the server.
echo.
java -cp out Main
pause
