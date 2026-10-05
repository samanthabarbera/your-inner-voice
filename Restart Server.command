#!/bin/bash
cd /Users/samanthabarbera/Documents/TUNE-UP

# Kill any existing server process on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Start fresh
npm run dev
