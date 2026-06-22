#!/bin/bash
# Start a simple local server to host the PWA
PORT=8000
echo "Starting local PWA Dev Server on http://localhost:$PORT..."
echo "Press Ctrl+C to stop."
python3 -m http.server $PORT
