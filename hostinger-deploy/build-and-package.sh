#!/usr/bin/env bash
# ============================================================
# PawGlobal — Build & Package for Hostinger Deployment
# ============================================================
# Run this script from the ROOT of the Replit project:
#   bash hostinger-deploy/build-and-package.sh
#
# Output: hostinger-deploy/pawglobal-hostinger.zip
# Upload that zip to your Hostinger server and follow the
# instructions in SETUP_GUIDE.md
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$SCRIPT_DIR/dist"
ZIP_NAME="$SCRIPT_DIR/pawglobal-hostinger.zip"

echo ""
echo "🐾  PawGlobal — Building for Hostinger"
echo "========================================="
echo ""

# 1. Build the React frontend
echo "📦  Step 1/3: Building React frontend..."
cd "$ROOT_DIR/artifacts/pawglobal"

# Build with production config (no Replit plugins)
PORT=3000 BASE_PATH=/ \
  NODE_ENV=production \
  REPL_ID="" \
  npx vite build --config vite.config.production.ts

echo "✅  Frontend built → artifacts/pawglobal/dist/public/"
echo ""

# 2. Prepare the output directory
echo "📁  Step 2/3: Assembling deployment package..."
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/public"

# Copy server files
cp "$SCRIPT_DIR/server.js"    "$OUT_DIR/server.js"
cp "$SCRIPT_DIR/package.json" "$OUT_DIR/package.json"
cp "$SCRIPT_DIR/.env.example" "$OUT_DIR/.env.example"
cp "$SCRIPT_DIR/schema.sql"   "$OUT_DIR/schema.sql"

# Copy built frontend
cp -r "$ROOT_DIR/artifacts/pawglobal/dist/public/." "$OUT_DIR/public/"

echo "✅  Files assembled in hostinger-deploy/dist/"
echo ""

# 3. Create zip
echo "🗜️   Step 3/3: Creating zip archive..."
cd "$SCRIPT_DIR"
rm -f "$ZIP_NAME"
zip -r "pawglobal-hostinger.zip" dist/ SETUP_GUIDE.md 2>/dev/null || \
  zip -r "pawglobal-hostinger.zip" dist/
echo ""
echo "========================================="
echo "✅  Build complete!"
echo ""
echo "📁  Deployment zip:  hostinger-deploy/pawglobal-hostinger.zip"
echo ""
echo "Next steps:"
echo "  1. Download:  hostinger-deploy/pawglobal-hostinger.zip"
echo "  2. Upload to your Hostinger server"
echo "  3. SSH in and extract: unzip pawglobal-hostinger.zip"
echo "  4. Go into dist/: cd dist"
echo "  5. Install:  npm install --production"
echo "  6. Copy env: cp .env.example .env  then edit .env"
echo "  7. Setup DB: psql \$DATABASE_URL -f schema.sql"
echo "  8. Start:    node server.js"
echo ""
echo "Full setup instructions: hostinger-deploy/SETUP_GUIDE.md"
echo "========================================="
