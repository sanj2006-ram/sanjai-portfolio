Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 630

$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Background: #07090E
$bgColor = [System.Drawing.Color]::FromArgb(7, 9, 14)
$g.Clear($bgColor)

# Subtle background border
$w2 = [int]($width - 40)
$h2 = [int]($height - 40)
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(35, 45, 65), 2)
$rect = New-Object System.Drawing.Rectangle(20, 20, $w2, $h2)
$g.DrawRectangle($borderPen, $rect)

# Draw Accent Radial/Gradient Top-Right Glow
$brushViolet = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, 121, 40, 202))
$g.FillEllipse($brushViolet, 650, -80, 650, 650)

# Load portrait.jpg
$portraitPath = "C:\Users\DELL\Desktop\Sanjai_Ram_Portfolio\modular\assets\portrait.jpg"
if (Test-Path $portraitPath) {
    $img = [System.Drawing.Image]::FromFile($portraitPath)
    $destRect = New-Object System.Drawing.Rectangle(730, 65, 400, 500)
    $g.DrawImage($img, $destRect)
    $img.Dispose()
    
    # Photo border
    $photoBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(0, 210, 255), 3)
    $g.DrawRectangle($photoBorderPen, $destRect)
}

# Typography
$fontBadge = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
$fontTitle = New-Object System.Drawing.Font("Segoe UI", 48, [System.Drawing.FontStyle]::Bold)
$fontRole = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Bold)
$fontSkills = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Regular)
$fontFooter = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)

$bullet = [char]0x2022

# Badge: Business Intelligence & Data Analytics
$badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 210, 255))
$badgeText = "EXECUTIVE CANDIDATE DOSSIER $bullet DATA & BI"
$g.DrawString($badgeText, $fontBadge, $badgeBrush, 70, 85)

# Title: Sanjai Ram M
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248, 250, 255))
$g.DrawString("Sanjai Ram M", $fontTitle, $whiteBrush, 68, 130)

# Role: Data Analyst & BI Developer
$roleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 175, 65)) # Warm Gold
$g.DrawString("Data Analyst & BI Specialist", $fontRole, $roleBrush, 70, 225)

# Description / Skills
$grayBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(165, 180, 205))
$skillsText = "Power BI Dashboards $bullet DAX Modeling & Optimization`nPower Query ETL $bullet MySQL Database Analytics`nStar Schema Architecture $bullet Performance Dashboards"
$g.DrawString($skillsText, $fontSkills, $grayBrush, 70, 285)

# Highlights pill box
$boxBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 22, 34))
$boxPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(45, 60, 88), 1)
$boxRect = New-Object System.Drawing.Rectangle(70, 420, 590, 70)
$g.FillRectangle($boxBrush, $boxRect)
$g.DrawRectangle($boxPen, $boxRect)

$tagFont = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
$tagBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 225, 250))
$g.DrawString("Chennai, India $bullet Guru Nanak College $bullet Izeon Innovative", $tagFont, $tagBrush, 90, 442)

# Footer URL
$urlBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 210, 255))
$g.DrawString("https://sanjai-analytics.vercel.app/", $fontFooter, $urlBrush, 70, 525)

# Clean up & Save
$outputPath = "C:\Users\DELL\Desktop\Sanjai_Ram_Portfolio\modular\assets\og-image.jpg"
$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)

# Also copy to root assets
$rootAssets = "C:\Users\DELL\Desktop\Sanjai_Ram_Portfolio\assets"
if (!(Test-Path $rootAssets)) { New-Item -ItemType Directory -Path $rootAssets | Out-Null }
Copy-Item $outputPath (Join-Path $rootAssets "og-image.jpg") -Force
Copy-Item $outputPath "C:\Users\DELL\Desktop\Sanjai_Ram_Portfolio\og-image.jpg" -Force

$bmp.Dispose()
$g.Dispose()

Write-Output "OG Image generated successfully at $outputPath"
