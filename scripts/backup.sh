#!/bin/bash
# Database backup script for Tourist Rewards System

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ENVIRONMENT=${NODE_ENV:-development}

# Database configuration
DB_HOST=${POSTGRES_HOST:-postgres}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-tourist_rewards}
DB_USER=${POSTGRES_USER:-postgres}

echo -e "${BLUE}🗄️  Starting database backup for ${ENVIRONMENT} environment${NC}"
echo -e "${BLUE}================================================================${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename
BACKUP_FILE="${BACKUP_DIR}/backup_${ENVIRONMENT}_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="${BACKUP_FILE}.gz"

echo -e "${YELLOW}📦 Creating backup: $(basename $BACKUP_FILE)${NC}"

# Create database backup
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"; then
    echo -e "${GREEN}✅ Database backup created successfully${NC}"
    
    # Compress backup
    echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
    if gzip "$BACKUP_FILE"; then
        echo -e "${GREEN}✅ Backup compressed: $(basename $BACKUP_COMPRESSED)${NC}"
        FINAL_BACKUP="$BACKUP_COMPRESSED"
    else
        echo -e "${YELLOW}⚠️  Compression failed, keeping uncompressed backup${NC}"
        FINAL_BACKUP="$BACKUP_FILE"
    fi
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$FINAL_BACKUP" | cut -f1)
    echo -e "${GREEN}📊 Backup size: ${BACKUP_SIZE}${NC}"
    
    # Create backup metadata
    METADATA_FILE="${BACKUP_DIR}/backup_${ENVIRONMENT}_${TIMESTAMP}.json"
    cat > "$METADATA_FILE" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "${ENVIRONMENT}",
  "database": "${DB_NAME}",
  "host": "${DB_HOST}",
  "filename": "$(basename $FINAL_BACKUP)",
  "size": "${BACKUP_SIZE}",
  "compressed": $([ "$FINAL_BACKUP" = "$BACKUP_COMPRESSED" ] && echo "true" || echo "false"),
  "status": "completed"
}
EOF
    
    echo -e "${GREEN}✅ Backup metadata created: $(basename $METADATA_FILE)${NC}"
    
else
    echo -e "${RED}❌ Database backup failed${NC}"
    
    # Create failure metadata
    METADATA_FILE="${BACKUP_DIR}/backup_${ENVIRONMENT}_${TIMESTAMP}.json"
    cat > "$METADATA_FILE" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "${ENVIRONMENT}",
  "database": "${DB_NAME}",
  "host": "${DB_HOST}",
  "status": "failed",
  "error": "pg_dump command failed"
}
EOF
    
    exit 1
fi

# Clean up old backups
echo -e "${YELLOW}🧹 Cleaning up old backups (retention: ${RETENTION_DAYS} days)${NC}"

# Find and remove old backup files
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "backup_${ENVIRONMENT}_*.sql*" -mtime +${RETENTION_DAYS} 2>/dev/null || true)
OLD_METADATA=$(find "$BACKUP_DIR" -name "backup_${ENVIRONMENT}_*.json" -mtime +${RETENTION_DAYS} 2>/dev/null || true)

if [ -n "$OLD_BACKUPS" ]; then
    echo "$OLD_BACKUPS" | while read -r file; do
        if [ -f "$file" ]; then
            echo -e "${YELLOW}  Removing old backup: $(basename $file)${NC}"
            rm "$file"
        fi
    done
fi

if [ -n "$OLD_METADATA" ]; then
    echo "$OLD_METADATA" | while read -r file; do
        if [ -f "$file" ]; then
            echo -e "${YELLOW}  Removing old metadata: $(basename $file)${NC}"
            rm "$file"
        fi
    done
fi

# List current backups
echo -e "\n${BLUE}📋 Current backups:${NC}"
ls -lah "$BACKUP_DIR"/backup_${ENVIRONMENT}_* 2>/dev/null | while read -r line; do
    echo -e "${GREEN}  $line${NC}"
done || echo -e "${YELLOW}  No backups found${NC}"

# Backup verification
echo -e "\n${YELLOW}🔍 Verifying backup integrity...${NC}"
if [ "$FINAL_BACKUP" = "$BACKUP_COMPRESSED" ]; then
    # Verify compressed backup
    if gzip -t "$FINAL_BACKUP"; then
        echo -e "${GREEN}✅ Compressed backup integrity verified${NC}"
    else
        echo -e "${RED}❌ Compressed backup integrity check failed${NC}"
        exit 1
    fi
else
    # Verify uncompressed backup
    if [ -s "$FINAL_BACKUP" ]; then
        echo -e "${GREEN}✅ Backup file exists and is not empty${NC}"
    else
        echo -e "${RED}❌ Backup file is empty or missing${NC}"
        exit 1
    fi
fi

echo -e "\n${GREEN}🎉 Backup completed successfully!${NC}"
echo -e "${GREEN}📁 Backup location: ${FINAL_BACKUP}${NC}"
echo -e "${GREEN}📊 Backup size: ${BACKUP_SIZE}${NC}"

# Optional: Send notification (if configured)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    echo -e "${YELLOW}📢 Sending notification...${NC}"
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Database backup completed for ${ENVIRONMENT} environment\nFile: $(basename $FINAL_BACKUP)\nSize: ${BACKUP_SIZE}\"}" \
        "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || echo -e "${YELLOW}⚠️  Notification failed${NC}"
fi

# Optional: Upload to cloud storage (if configured)
if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
    echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
    if aws s3 cp "$FINAL_BACKUP" "s3://${AWS_S3_BUCKET}/backups/$(basename $FINAL_BACKUP)"; then
        echo -e "${GREEN}✅ Backup uploaded to S3${NC}"
    else
        echo -e "${YELLOW}⚠️  S3 upload failed${NC}"
    fi
fi