"""Generate favicon.ico and apple-touch-icon from Superboard branding."""
from PIL import Image, ImageDraw
import os

def create_favicon(size):
    """Create a rounded square favicon with Superboard branding."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background: emerald gradient (rounded square)
    margin = size // 10
    radius = size // 5
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=(5, 150, 105, 255),  # emerald-600
    )
    
    # Draw a simplified graduation cap
    cx, cy = size // 2, size // 2 - size // 12
    cap_w = size // 3
    
    # Mortarboard (diamond shape)
    draw.polygon([
        (cx, cy - cap_w // 2),
        (cx + cap_w, cy),
        (cx, cy + cap_w // 3),
        (cx - cap_w, cy),
    ], fill=(255, 255, 255, 230))
    
    # Tassel line
    draw.line([(cx, cy), (cx, cy + size // 5)], fill=(255, 255, 255, 200), width=max(1, size // 30))
    # Tassel button
    draw.ellipse([cx - size // 20, cy + size // 5 - size // 20, cx + size // 20, cy + size // 5 + size // 20], fill=(255, 255, 255, 230))
    
    return img

# Generate multi-size ICO
sizes = [16, 32, 48]
images = [create_favicon(s) for s in sizes]

out_dir = "/home/z/my-project/public"

# Save as ICO (multi-resolution)
ico_path = os.path.join(out_dir, "favicon.ico")
images[0].save(ico_path, format="ICO", sizes=[(s, s) for s in sizes])
print(f"Generated favicon.ico ({sizes})")

# Save apple-touch-icon (180x180)
apple_icon = create_favicon(180)
apple_path = os.path.join(out_dir, "apple-touch-icon.png")
apple_icon.save(apple_path, format="PNG")
print(f"Generated apple-touch-icon.png (180x180)")

# Save favicon-32.png
favicon32 = create_favicon(32)
favicon32_path = os.path.join(out_dir, "favicon-32.png")
favicon32.save(favicon32_path, format="PNG")
print("Generated favicon-32.png")
