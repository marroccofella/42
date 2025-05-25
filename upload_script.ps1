# FTP Upload Script for Ateroids 4.0
$ftpServer = "212.85.249.220"
$username = "dom42uk"
$password = "ztjH8cuEtW39"
$localPath = ".\*"
$remotePath = "/public_html/ateroids-v4"

# Create FTP Web Request
$webclient = New-Object System.Net.WebClient
$webclient.Credentials = New-Object System.Net.NetworkCredential($username, $password)

# Get all files in the current directory
$files = Get-ChildItem -Path $localPath -File

foreach ($file in $files) {
    if ($file.Name -ne $MyInvocation.MyCommand.Name) {  # Don't upload this script
        $uri = "ftp://$ftpServer$remotePath/$($file.Name)"
        $localFile = $file.FullName
        
        Write-Host "Uploading $($file.Name)..."
        try {
            $webclient.UploadFile($uri, $localFile)
            Write-Host "Successfully uploaded $($file.Name)" -ForegroundColor Green
        }
        catch {
            Write-Host "Failed to upload $($file.Name): $_" -ForegroundColor Red
        }
    }
}

Write-Host "Upload complete!"
Write-Host "Game should be available at: http://42.uk/ateroids-v4/" -ForegroundColor Cyan
