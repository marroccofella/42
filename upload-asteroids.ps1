$ftp = "ftp://212.85.249.220/www/ateroids/"
$user = "dom42uk"
$pass = "ztjH8cuEtW39"
$files = @("index.html", "game.js", "style.css", "README.md")

foreach ($file in $files) {
    $uri = $ftp + $file
    $webclient = New-Object System.Net.WebClient
    $webclient.Credentials = New-Object System.Net.NetworkCredential($user, $pass)
    Write-Host "Uploading $file ..."
    $webclient.UploadFile($uri, $file)
    $webclient.Dispose()
    Write-Host "Uploaded $file"
}
