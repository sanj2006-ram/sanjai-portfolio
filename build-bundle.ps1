$ErrorActionPreference = "Stop"

$baseDir = "C:\Users\DELL\Desktop\Sanjai_Ram_Portfolio"
$modularDir = Join-Path $baseDir "modular"
$htmlPath = Join-Path $modularDir "index.html"
$cssPath = Join-Path $modularDir "style.css"
$jsPath = Join-Path $modularDir "script.js"
$portraitPath = Join-Path $modularDir "assets\portrait.jpg"
$faviconPath = Join-Path $modularDir "assets\favicon.svg"
$outputHtml = Join-Path $baseDir "index.html"

Write-Output "Reading modular files..."
$html = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)
$css = [System.IO.File]::ReadAllText($cssPath, [System.Text.Encoding]::UTF8)
$js = [System.IO.File]::ReadAllText($jsPath, [System.Text.Encoding]::UTF8)

# Encode portrait.jpg to base64
if (Test-Path $portraitPath) {
    Write-Output "Inlining portrait.jpg as Base64..."
    $imgBytes = [System.IO.File]::ReadAllBytes($portraitPath)
    $imgB64 = [System.Convert]::ToBase64String($imgBytes)
    $html = $html.Replace('assets/portrait.jpg', "data:image/jpeg;base64,$imgB64")
}

# Encode favicon.svg to base64
if (Test-Path $faviconPath) {
    Write-Output "Inlining favicon.svg as Base64..."
    $favBytes = [System.IO.File]::ReadAllBytes($faviconPath)
    $favB64 = [System.Convert]::ToBase64String($favBytes)
    $html = $html.Replace('assets/favicon.svg', "data:image/svg+xml;base64,$favB64")
}

# Inline CSS
Write-Output "Inlining style.css..."
$cssTag = "<style>`n$css`n</style>"
$html = [System.Text.RegularExpressions.Regex]::Replace($html, '<link\s+rel=["'']stylesheet["'']\s+href=["'']style\.css(\?[^"'']*)?["'']\s*>', $cssTag)

# Inline JS
Write-Output "Inlining script.js..."
$jsTag = "<script>`n$js`n</script>"
$html = [System.Text.RegularExpressions.Regex]::Replace($html, '<script\s+src=["'']script\.js["'']\s*></script>', $jsTag)

# Save standalone bundled index.html
[System.IO.File]::WriteAllText($outputHtml, $html, [System.Text.Encoding]::UTF8)
$len = ([System.IO.FileInfo]$outputHtml).Length
Write-Output "Standalone bundle created successfully at: $outputHtml ($len bytes)"
