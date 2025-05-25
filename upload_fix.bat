@echo off
echo Creating directory ateroids-v4 on server...
echo mkdir ateroids-v4 | ftp -n 212.85.249.220

echo Uploading files...

:: Upload files one by one
echo Uploading index.html...
echo open 212.85.249.220> ftpcmd.dat
echo dom42uk>> ftpcmd.dat
echo ztjH8cuEtW39>> ftpcmd.dat
echo binary>> ftpcmd.dat
echo cd public_html>> ftpcmd.dat
echo cd ateroids-v4>> ftpcmd.dat
echo put index.html>> ftpcmd.dat
echo put game.js>> ftpcmd.dat
echo put style.css>> ftpcmd.dat
echo quit>> ftpcmd.dat

ftp -n -s:ftpcmd.dat
del ftpcmd.dat

echo.
echo Upload complete!
echo Game should be available at: http://42.uk/ateroids-v4/
pause
