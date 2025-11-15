#!/bin/bash
# Set file descriptor limit to prevent EMFILE errors
ulimit -n 65536

# Verify the setting
echo "File descriptor limit set to: $(ulimit -n)"
