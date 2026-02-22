#!/usr/bin/env sh
# Run the server from its directory so require() finds server/node_modules
cd "$(dirname "$0")/server" && exec node index.js
