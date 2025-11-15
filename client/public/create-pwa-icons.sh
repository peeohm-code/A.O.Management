#!/bin/bash
# Create placeholder PWA icons using ImageMagick (if available) or simple colored squares

# Check if convert (ImageMagick) is available
if command -v convert &> /dev/null; then
    # Create 192x192 icon
    convert -size 192x192 xc:'#00366D' -gravity center \
        -fill white -pointsize 60 -annotate +0+0 'QC' \
        pwa-192x192.png
    
    # Create 512x512 icon
    convert -size 512x512 xc:'#00366D' -gravity center \
        -fill white -pointsize 160 -annotate +0+0 'QC' \
        pwa-512x512.png
    
    echo "PWA icons created successfully with ImageMagick"
else
    # Fallback: create simple colored PNG files using Python
    python3 << 'PYTHON'
from PIL import Image, ImageDraw, ImageFont

# Create 192x192 icon
img192 = Image.new('RGB', (192, 192), color='#00366D')
draw192 = ImageDraw.Draw(img192)
try:
    font192 = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
except:
    font192 = ImageFont.load_default()
text = "QC"
bbox = draw192.textbbox((0, 0), text, font=font192)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
draw192.text(((192-text_width)/2, (192-text_height)/2), text, fill='white', font=font192)
img192.save('pwa-192x192.png')

# Create 512x512 icon
img512 = Image.new('RGB', (512, 512), color='#00366D')
draw512 = ImageDraw.Draw(img512)
try:
    font512 = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 160)
except:
    font512 = ImageFont.load_default()
bbox = draw512.textbbox((0, 0), text, font=font512)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
draw512.text(((512-text_width)/2, (512-text_height)/2), text, fill='white', font=font512)
img512.save('pwa-512x512.png')

print("PWA icons created successfully with Python PIL")
PYTHON
fi
