#!/bin/bash

# Weekly Update Script for Dinner Spinner
# Runs every Sunday at 2 AM

LOG_FILE="/var/log/dinner-spinner-weekly-update.log"
BACKUP_DIR="/home/$(whoami)/dinner-spinner-backups"
APP_DIR="/home/$(whoami)/dinner-spinner"

# Function to log messages with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | sudo tee -a "$LOG_FILE"
}

# Function to send notification (optional)
send_notification() {
    # Uncomment and configure if you want email notifications
    # echo "$1" | mail -s "Dinner Spinner Update" your-email@example.com
    log "$1"
}

log "=== Starting weekly update process ==="

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup of current application
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
log "Creating backup: $BACKUP_NAME"
cp -r "$APP_DIR" "$BACKUP_DIR/$BACKUP_NAME"

# Update system packages
log "Updating system packages..."
sudo apt update >> "$LOG_FILE" 2>&1
UPDATES_AVAILABLE=$(apt list --upgradable 2>/dev/null | grep -c upgradable)

if [ "$UPDATES_AVAILABLE" -gt 1 ]; then
    log "Found $((UPDATES_AVAILABLE - 1)) package updates available"
    sudo apt upgrade -y >> "$LOG_FILE" 2>&1
    log "System packages updated successfully"
else
    log "No system updates available"
fi

# Update Node.js dependencies
log "Updating Node.js dependencies..."
cd "$APP_DIR"
npm update --production >> "$LOG_FILE" 2>&1

# Check if service is running before restart
if sudo systemctl is-active --quiet dinner-spinner; then
    log "Restarting dinner-spinner service..."
    sudo systemctl restart dinner-spinner
    
    # Wait for service to start
    sleep 10
    
    # Test if service is working
    if sudo systemctl is-active --quiet dinner-spinner; then
        if curl -s http://localhost:3000/ > /dev/null; then
            log "✅ Service restart successful - application is responding"
            send_notification "Dinner Spinner weekly update completed successfully"
        else
            log "❌ Service started but application not responding"
            send_notification "Dinner Spinner update completed but service may have issues"
        fi
    else
        log "❌ Service failed to restart"
        send_notification "Dinner Spinner update failed - service not running"
    fi
else
    log "Service was not running before update"
fi

# Clean up old backups (keep only last 4 weeks)
log "Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -t | tail -n +5 | xargs rm -rf 2>/dev/null || true

# Check disk space
DISK_USAGE=$(df /home | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    log "⚠️  Warning: Disk usage is ${DISK_USAGE}%"
    send_notification "Dinner Spinner server disk usage high: ${DISK_USAGE}%"
fi

log "=== Weekly update process completed ==="
echo "" | sudo tee -a "$LOG_FILE"
