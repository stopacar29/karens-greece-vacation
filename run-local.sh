#!/bin/bash
# Build the website and run it locally at http://localhost:3000
set -e
cd "$(dirname "$0")"

echo "==> Installing web app dependencies..."
(cd web-app && npm install)

echo "==> Building the website..."
(cd web-app && npm run build)

echo "==> Installing server dependencies..."
(cd server && npm install)

echo ""
echo "==> Starting. Open http://localhost:3000 in your browser (Ctrl+C to stop)."
cd server && node index.js
