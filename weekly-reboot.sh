#!/bin/bash

# Weekly Reboot Script
# Runs after updates to ensure clean restart

LOG_FILE="/var/log/dinner-spinner-weekly-update.log"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | sudo tee -a "$LOG_FILE"
}

log "=== Initiating scheduled weekly reboot ==="

# Give services time to finish any ongoing operations
sleep 30

# Reboot the system
log "Rebooting system now..."
sudo reboot
