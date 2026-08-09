"""Generate Open Graph image for Superboard."""
from PIL import Image, ImageDraw, ImageFont
import os

WIDTH, HEIGHT = 1200, 630
BG_COLOR = (255, 255, 255)
PRIMARY = (5, 150, 105)  # emerald-600
SECONDARY = (8, 145, 178)  # cyan-600
TEXT_DARK = (17, 24, 39)  # gray-900
TEXT_GRAY = (107, 114, 128)  # gray-500

img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
draw = ImageDraw.Draw(img)

# Draw a subtle gradient-like background accent (top-right corner)
for y in range(HEIGHT):
    for x_start in range(WIDTH // 2, WIDTH):
        dist = ((x_start - WIDTH) ** 2 + (y - 0) ** 2) ** 0.5
        alpha = max(0, min(40, int(40 * (1 - dist / 800))))
        if alpha > 0:
            px = img.getpixel((x_start, y))
            new_color = (
                min(255, px[0] + alpha),
                min(255, px[1] + alpha),
                min(255, px[2] + alpha),
            )
            img.putpixel((x_start, y), new_color)

# Draw a green circle/badge in top-left
cx, cy, r = 120, 120, 50
draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=PRIMARY)
# Graduation cap icon (simplified)
draw.polygon([(cx - 20, cy + 5), (cx + 20, cy + 5), (cx + 25, cy - 5), (cx - 25, cy - 5)], fill=(255, 255, 255))
draw.rectangle([cx - 3, cy + 5, cx + 3, cy + 25], fill=(255, 255, 255))

# Try to get a good font
font_paths = [
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
font_path = None
for fp in font_paths:
    if os.path.exists(fp):
        try:
            with open(fp, 'rb') as f:
                header = f.read(4)
                if header in (b'\x00\x01\x00\x00', b'OTTO', b'true'):
                    font_path = fp
                    break
        except:
            continue

regular_paths = [
    "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]
regular_path = None
for fp in regular_paths:
    if os.path.exists(fp):
        try:
            with open(fp, 'rb') as f:
                header = f.read(4)
                if header in (b'\x00\x01\x00\x00', b'OTTO', b'true'):
                    regular_path = fp
                    break
        except:
            continue

title_font = ImageFont.truetype(font_path, 72) if font_path else ImageFont.load_default()
sub_font = ImageFont.truetype(regular_path, 32) if regular_path else ImageFont.load_default()
small_font = ImageFont.truetype(regular_path, 24) if regular_path else ImageFont.load_default()

# Title
draw.text((100, 220), "Superboard", fill=PRIMARY, font=title_font)

# Subtitle
draw.text((104, 310), "Smart Tutoring Whiteboard", fill=TEXT_DARK, font=sub_font)

# Description line
draw.text((104, 370), "AI-powered tools  \u2022  Video calling  \u2022  Real-time collaboration", fill=TEXT_GRAY, font=small_font)

# Bottom-right URL
draw.text((104, 560), "superboard.app", fill=TEXT_GRAY, font=small_font)

# Save
out_dir = "/home/z/my-project/public"
img.save(os.path.join(out_dir, "og-image.png"), "PNG")
print(f"Generated og-image.png ({WIDTH}x{HEIGHT})")
