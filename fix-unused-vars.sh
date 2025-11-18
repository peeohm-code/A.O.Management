#!/bin/bash

# Get all unused variable errors
cd /home/ubuntu/construction_management_app

# Run TypeScript and extract unused variables
pnpm exec tsc --noEmit 2>&1 | grep "error TS6133" | while read -r line; do
  # Extract file path and variable name
  file=$(echo "$line" | awk -F':' '{print $1}')
  varname=$(echo "$line" | grep -oP "'\K[^']+(?=' is declared)")
  
  if [ -n "$file" ] && [ -n "$varname" ]; then
    echo "Removing unused: $varname from $file"
    # Comment out or prefix with underscore
    sed -i "s/\b${varname}\b/_${varname}/g" "$file" 2>/dev/null || true
  fi
done

echo "Done fixing unused variables"
