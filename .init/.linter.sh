#!/bin/bash
cd /home/kavia/workspace/code-generation/llm-costinsight-dashboard-112884-308e7fe4/frontend_react
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

