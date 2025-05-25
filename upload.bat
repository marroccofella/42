@echo off
echo Uploading files to server...

echo Uploading index.html...
curl -T index.html ftp://212.85.249.220/public_html/ateroids-v4/ --user dom42uk:ztjH8cuEtW39

echo Uploading game.js...
curl -T game.js ftp://212.85.249.220/public_html/ateroids-v4/ --user dom42uk:ztjH8cuEtW39

echo Uploading style.css...
curl -T style.css ftp://212.85.249.220/public_html/ateroids-v4/ --user dom42uk:ztjH8cuEtW39

echo Upload complete!
echo.
echo Game should be available at: http://42.uk/ateroids-v4/
pause
