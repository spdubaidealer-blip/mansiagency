@echo off
set PATH=C:\Program Files\Git\cmd;%PATH%
git add .
git commit -m "Fix duplicate router declaration in admin login page"
git push origin main
