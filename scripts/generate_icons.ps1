Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\sharm\.gemini\antigravity-ide\brain\1e06ad6d-0573-4946-9ae5-b993fff745d9\media__1786608398906.png"
$img = [System.Drawing.Image]::FromFile($srcPath)
$origWidth = $img.Width
$origHeight = $img.Height
$aspect = $origWidth / $origHeight

function Create-SquareIcon {
    param(
        [string]$outPath,
        [int]$canvasSize,
        [int]$targetHeight,
        [bool]$hasWhiteBg
    )
    $targetWidth = [int]($targetHeight * $aspect)
    $bmp = New-Object System.Drawing.Bitmap($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($hasWhiteBg) {
        $g.Clear([System.Drawing.Color]::White)
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    $x = [int](($canvasSize - $targetWidth) / 2)
    $y = [int](($canvasSize - $targetHeight) / 2)

    $destRect = New-Object System.Drawing.Rectangle($x, $y, $targetWidth, $targetHeight)
    $g.DrawImage($img, $destRect)

    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated $outPath"
}

Create-SquareIcon -outPath "d:\ElderlyCarePatient\assets\images\icon.png" -canvasSize 1024 -targetHeight 640 -hasWhiteBg $true
Create-SquareIcon -outPath "d:\ElderlyCarePatient\assets\images\android-icon-foreground.png" -canvasSize 1024 -targetHeight 540 -hasWhiteBg $false
Create-SquareIcon -outPath "d:\ElderlyCarePatient\assets\images\splash-icon.png" -canvasSize 1024 -targetHeight 600 -hasWhiteBg $false
Create-SquareIcon -outPath "d:\ElderlyCarePatient\assets\images\favicon.png" -canvasSize 48 -targetHeight 38 -hasWhiteBg $false

$img.Dispose()
