# FTP Upload Script for Ateroids 4.0
$ftpServer = "ftp://212.85.249.220"
$username = "dom42uk"
$password = "ztjH8cuEtW39"
$files = @("index.html", "game.js", "style.css")

# Create FTP request
$ftpRequest = [System.Net.FtpWebRequest]::Create("$ftpServer/public_html/ateroids-v4/")
$ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
$ftpRequest.Credentials = New-Object System.Net.NetworkCredential($username, $password)
$ftpRequest.UseBinary = $true
$ftpRequest.KeepAlive = $false

try {
    $response = $ftpRequest.GetResponse()
    Write-Host "Directory created successfully" -ForegroundColor Green
    $response.Close()
} catch [Net.WebException] {
    if ($_.Exception.Response.StatusDescription -match "exists") {
        Write-Host "Directory already exists" -ForegroundColor Yellow
    } else {
        Write-Host "Error creating directory: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Upload files
foreach ($file in $files) {
    $localFile = Get-Item $file
    $uri = "$ftpServer/public_html/ateroids-v4/$file"
    
    Write-Host "Uploading $file..."
    
    try {
        $webclient = New-Object System.Net.WebClient
        $webclient.Credentials = New-Object System.Net.NetworkCredential($username, $password)
        $webclient.UploadFile($uri, $localFile.FullName)
        Write-Host "Successfully uploaded $file" -ForegroundColor Green
    } catch {
        Write-Host "Failed to upload $file : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Upload process completed!" -ForegroundColor Cyan
Write-Host "Game should be available at: http://42.uk/ateroids-v4/" -ForegroundColor Cyan
Read-Host "Press Enter to exit"
