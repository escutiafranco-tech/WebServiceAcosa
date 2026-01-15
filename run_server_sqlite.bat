@echo off
cd /d "%~dp0"
set USE_SQLITE=true
node server.js
