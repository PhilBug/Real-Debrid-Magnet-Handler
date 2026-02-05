#!/bin/bash
# Create placeholder extension icons using ImageMagick or simple SVG

ICON_DIR="src/assets/icons"
mkdir -p "$ICON_DIR"

# Create simple SVG icon
cat > "$ICON_DIR/icon.svg" << 'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#3B82F6" rx="16"/>
  <text x="64" y="85" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">RD</text>
</svg>
EOF

# Check if convert (ImageMagick) is available
if command -v convert &> /dev/null; then
  convert "$ICON_DIR/icon.svg" -resize 16x16 "$ICON_DIR/icon-16.png"
  convert "$ICON_DIR/icon.svg" -resize 48x48 "$ICON_DIR/icon-48.png"
  convert "$ICON_DIR/icon.svg" -resize 128x128 "$ICON_DIR/icon-128.png"
  echo "Icons created using ImageMagick"
else
  # Fallback: copy SVG as PNG placeholder (will work for testing)
  cp "$ICON_DIR/icon.svg" "$ICON_DIR/icon-16.png"
  cp "$ICON_DIR/icon.svg" "$ICON_DIR/icon-48.png"
  cp "$ICON_DIR/icon.svg" "$ICON_DIR/icon-128.png"
  echo "ImageMagick not found - SVG copies created as placeholders"
  echo "Install ImageMagick for proper PNG conversion: sudo apt install imagemagick"
fi
