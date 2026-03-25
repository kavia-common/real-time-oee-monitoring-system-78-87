#!/bin/bash
cd /home/kavia/workspace/code-generation/real-time-oee-monitoring-system-78-87/frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

