Add-Type -AssemblyName System.Drawing
$src = 'C:\Users\EHK STUDENT 015\Documents\Qoder\2026-10-26\6285b53c\vibe_images'
$dest = 'C:\Users\EHK STUDENT 015\Documents\Qoder\2026-10-26\6285b53c\stokana\frontend\assets\products'

$map = [ordered]@{
  'stokana-headphones_'  = 'headphones.jpg'
  'stokana-powerbank_'   = 'powerbank.jpg'
  'stokana-speaker_'     = 'speaker.jpg'
  'stokana-laptop_'      = 'laptop.jpg'
  'stokana-mouse_'       = 'mouse.jpg'
  'stokana-cleanser_'    = 'cleanser.jpg'
  'stokana-serum_'       = 'serum.jpg'
  'stokana-lotion_'      = 'lotion.jpg'
  'stokana-basket_'      = 'basket.jpg'
  'stokana-coffee-set_'  = 'coffee-set.jpg'
  'stokana-blanket_'     = 'blanket.jpg'
  'stokana-coffee-beans_'= 'coffee-beans.jpg'
  'stokana-tote_'        = 'tote.jpg'
  'stokana-shirt_'       = 'shirt.jpg'
  'stokana-solar-light_' = 'solar-light.jpg'
  'stokana-sandals_'     = 'sandals.jpg'
}

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 86L)

foreach ($key in $map.Keys) {
  $file = Get-ChildItem -Path $src -Filter "$($key)*.png" | Select-Object -First 1
  if (-not $file) { Write-Output "MISSING $key"; continue }
  $img = [System.Drawing.Image]::FromFile($file.FullName)
  $bmp = New-Object System.Drawing.Bitmap 900, 900
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($img, 0, 0, 900, 900)
  $out = Join-Path $dest $map[$key]
  $bmp.Save($out, $codec, $params)
  $g.Dispose()
  $bmp.Dispose()
  $img.Dispose()
  Write-Output "wrote $($map[$key])"
}
