#!/bin/bash
# setup-production-monitoring.sh - Set up monitoring and logging for production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Setting up Production Monitoring and Logging${NC}"
echo -e "${BLUE}=============================================${NC}"

# Load production environment
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found${NC}"
    exit 1
fi

source .env.production

# Create monitoring directories
echo -e "\n${BLUE}📁 Creating monitoring directories...${NC}"
mkdir -p logs/production
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana
mkdir -p monitoring/alerts

# Create log rotation configuration
echo -e "\n${BLUE}🔄 Setting up log rotation...${NC}"
cat > /etc/logrotate.d/tourist-rewards << EOF
/var/log/tourist-rewards/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 tourist-rewards tourist-rewards
    postrotate
        systemctl reload tourist-rewards-api || true
    endscript
}
EOF

# Create systemd service file
echo -e "\n${BLUE}⚙️  Creating systemd service...${NC}"
cat > /etc/systemd/system/tourist-rewards-api.service << EOF
[Unit]
Description=Tourist Rewards API Service
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=tourist-rewards
Group=tourist-rewards
WorkingDirectory=/opt/tourist-rewards
Environment=NODE_ENV=production
EnvironmentFile=/opt/tourist-rewards/.env.production
ExecStart=/usr/bin/node dist/api/app.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=tourist-rewards-api

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/tourist-rewards/logs

[Install]
WantedBy=multi-user.target
EOF

# Create Prometheus configuration
echo -e "\n${BLUE}📈 Setting up Prometheus monitoring...${NC}"
cat > monitoring/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'tourist-rewards-api'
    static_configs:
      - targets: ['localhost:${PROMETHEUS_PORT:-9090}']
    scrape_interval: 10s
    metrics_path: /metrics

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['localhost:9121']
EOF

# Create Prometheus alert rules
cat > monitoring/prometheus/alert_rules.yml << EOF
groups:
  - name: tourist-rewards-alerts
    rules:
      - alert: APIHighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "API error rate is {{ \$value }} errors per second"

      - alert: APIHighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API latency detected"
          description: "95th percentile latency is {{ \$value }} seconds"

      - alert: ContractTransactionFailure
        expr: increase(blockchain_transaction_failures_total[5m]) > 5
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Multiple contract transaction failures"
          description: "{{ \$value }} contract transactions failed in the last 5 minutes"

      - alert: DatabaseConnectionFailure
        expr: up{job="postgres-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection lost"
          description: "Cannot connect to PostgreSQL database"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%"

      - alert: DiskSpaceLow
        expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes > 0.9
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space low"
          description: "Disk usage is above 90%"

      - alert: AdminWalletLowBalance
        expr: ethereum_wallet_balance_ether{address="${ADMIN_ADDRESS}"} < 0.1
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Admin wallet balance low"
          description: "Admin wallet balance is {{ \$value }} MATIC"
EOF

# Create Grafana dashboard
echo -e "\n${BLUE}📊 Creating Grafana dashboard...${NC}"
cat > monitoring/grafana/tourist-rewards-dashboard.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "Tourist Rewards System",
    "tags": ["tourist-rewards", "blockchain"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "API Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec"
          }
        ]
      },
      {
        "id": 2,
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "id": 3,
        "title": "Contract Transactions",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(blockchain_transactions_total[5m])",
            "legendFormat": "{{type}}"
          }
        ]
      },
      {
        "id": 4,
        "title": "Database Connections",
        "type": "singlestat",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends{datname=\"tourist_rewards_production\"}"
          }
        ]
      },
      {
        "id": 5,
        "title": "System Resources",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          },
          {
            "expr": "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100",
            "legendFormat": "Memory Usage %"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "10s"
  }
}
EOF

# Create health check script for production
echo -e "\n${BLUE}🏥 Creating production health check...${NC}"
cat > scripts/production-health-check.js << EOF
const { ethers } = require("ethers");
const axios = require("axios");
const fs = require("fs");

class ProductionHealthCheck {
  constructor() {
    require("dotenv").config({ path: ".env.production" });
    
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.rpcUrl = process.env.RPC_URL;
    this.apiUrl = \`http://localhost:\${process.env.API_PORT || 3000}\`;
    this.adminAddress = process.env.ADMIN_PRIVATE_KEY ? 
      new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY).address : null;
    
    this.checks = [];
  }

  async runCheck(name, checkFunction) {
    const startTime = Date.now();
    try {
      await checkFunction();
      const duration = Date.now() - startTime;
      this.checks.push({ name, status: "healthy", duration, timestamp: new Date().toISOString() });
      console.log(\`✅ \${name}: healthy (\${duration}ms)\`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.checks.push({ 
        name, 
        status: "unhealthy", 
        duration, 
        error: error.message, 
        timestamp: new Date().toISOString() 
      });
      console.log(\`❌ \${name}: unhealthy - \${error.message}\`);
    }
  }

  async checkAPI() {
    const response = await axios.get(\`\${this.apiUrl}/health\`, { timeout: 5000 });
    if (response.status !== 200) {
      throw new Error(\`API returned status \${response.status}\`);
    }
  }

  async checkContract() {
    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    const code = await provider.getCode(this.contractAddress);
    if (code === "0x") {
      throw new Error("Contract not found at address");
    }
    
    // Check contract is responsive
    const contractABI = JSON.parse(
      fs.readFileSync("artifacts/contracts/SmileCoin.sol/SmileCoin.json")
    ).abi;
    const contract = new ethers.Contract(this.contractAddress, contractABI, provider);
    await contract.name();
  }

  async checkDatabase() {
    const response = await axios.get(\`\${this.apiUrl}/api/health/database\`, { timeout: 10000 });
    if (!response.data.healthy) {
      throw new Error("Database health check failed");
    }
  }

  async checkAdminWallet() {
    if (!this.adminAddress) {
      throw new Error("Admin wallet not configured");
    }
    
    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    const balance = await provider.getBalance(this.adminAddress);
    const balanceEther = parseFloat(ethers.formatEther(balance));
    
    if (balanceEther < 0.1) {
      throw new Error(\`Admin wallet balance too low: \${balanceEther} MATIC\`);
    }
  }

  async checkNetworkLatency() {
    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    const startTime = Date.now();
    await provider.getBlockNumber();
    const latency = Date.now() - startTime;
    
    if (latency > 5000) {
      throw new Error(\`Network latency too high: \${latency}ms\`);
    }
  }

  async run() {
    console.log("🏥 Running Production Health Checks");
    console.log("==================================");
    
    await this.runCheck("API Service", () => this.checkAPI());
    await this.runCheck("Smart Contract", () => this.checkContract());
    await this.runCheck("Database", () => this.checkDatabase());
    await this.runCheck("Admin Wallet", () => this.checkAdminWallet());
    await this.runCheck("Network Latency", () => this.checkNetworkLatency());
    
    const healthyChecks = this.checks.filter(c => c.status === "healthy").length;
    const totalChecks = this.checks.length;
    
    const report = {
      timestamp: new Date().toISOString(),
      overall_status: healthyChecks === totalChecks ? "healthy" : "unhealthy",
      checks: this.checks,
      summary: {
        total: totalChecks,
        healthy: healthyChecks,
        unhealthy: totalChecks - healthyChecks
      }
    };
    
    fs.writeFileSync("production-health-report.json", JSON.stringify(report, null, 2));
    
    console.log(\`\\n📊 Health Check Summary: \${healthyChecks}/\${totalChecks} checks passed\`);
    
    if (healthyChecks === totalChecks) {
      console.log("🎉 All systems healthy!");
      process.exit(0);
    } else {
      console.log("⚠️  Some systems unhealthy - check logs");
      process.exit(1);
    }
  }
}

new ProductionHealthCheck().run().catch(console.error);
EOF

# Create backup script
echo -e "\n${BLUE}💾 Setting up automated backups...${NC}"
cat > scripts/production-backup.sh << EOF
#!/bin/bash
# production-backup.sh - Automated backup for production

set -e

# Load production environment
source .env.production

BACKUP_DATE=\$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/var/backups/tourist-rewards/\$BACKUP_DATE"

echo "🔄 Starting production backup: \$BACKUP_DATE"

# Create backup directory
mkdir -p "\$BACKUP_DIR"

# Backup database
echo "📊 Backing up database..."
pg_dump "\$DATABASE_URL" > "\$BACKUP_DIR/database.sql"

# Backup configuration
echo "⚙️  Backing up configuration..."
cp .env.production "\$BACKUP_DIR/"
cp production-deployment-info.json "\$BACKUP_DIR/" 2>/dev/null || true

# Backup logs
echo "📝 Backing up logs..."
tar -czf "\$BACKUP_DIR/logs.tar.gz" logs/

# Create backup manifest
cat > "\$BACKUP_DIR/manifest.json" << EOL
{
  "timestamp": "\$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "type": "production_backup",
  "files": [
    "database.sql",
    ".env.production",
    "production-deployment-info.json",
    "logs.tar.gz"
  ],
  "database_size": "\$(du -h "\$BACKUP_DIR/database.sql" | cut -f1)",
  "total_size": "\$(du -sh "\$BACKUP_DIR" | cut -f1)"
}
EOL

# Upload to S3 if configured
if [ -n "\$BACKUP_S3_BUCKET" ] && [ -n "\$AWS_ACCESS_KEY_ID" ]; then
    echo "☁️  Uploading to S3..."
    tar -czf "\$BACKUP_DIR.tar.gz" -C "\$(dirname "\$BACKUP_DIR")" "\$(basename "\$BACKUP_DIR")"
    aws s3 cp "\$BACKUP_DIR.tar.gz" "s3://\$BACKUP_S3_BUCKET/backups/"
    rm "\$BACKUP_DIR.tar.gz"
fi

# Clean up old backups (keep last 30 days)
find /var/backups/tourist-rewards -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true

echo "✅ Backup completed: \$BACKUP_DIR"
EOF

chmod +x scripts/production-backup.sh

# Create monitoring docker-compose
echo -e "\n${BLUE}🐳 Creating monitoring Docker Compose...${NC}"
cat > docker-compose.monitoring.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=\${DATABASE_URL}
    restart: unless-stopped

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: redis-exporter
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=\${REDIS_URL}
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
EOF

# Create cron job for backups
echo -e "\n${BLUE}⏰ Setting up backup cron job...${NC}"
(crontab -l 2>/dev/null; echo "${BACKUP_SCHEDULE:-0 2 * * *} /opt/tourist-rewards/scripts/production-backup.sh >> /var/log/tourist-rewards/backup.log 2>&1") | crontab -

# Create log aggregation configuration
echo -e "\n${BLUE}📋 Setting up log aggregation...${NC}"
cat > /etc/rsyslog.d/50-tourist-rewards.conf << EOF
# Tourist Rewards System logs
if \$programname == 'tourist-rewards-api' then /var/log/tourist-rewards/api.log
& stop
EOF

systemctl restart rsyslog

echo -e "\n${GREEN}✅ Production monitoring setup completed!${NC}"
echo -e "${GREEN}======================================${NC}"

echo -e "\n${BLUE}📋 Monitoring Components Installed:${NC}"
echo -e "  ✅ Systemd service configuration"
echo -e "  ✅ Log rotation setup"
echo -e "  ✅ Prometheus monitoring"
echo -e "  ✅ Grafana dashboards"
echo -e "  ✅ Health check scripts"
echo -e "  ✅ Automated backup system"
echo -e "  ✅ Alert rules configuration"

echo -e "\n${BLUE}🚀 Next Steps:${NC}"
echo -e "1. Start monitoring services: ${YELLOW}docker-compose -f docker-compose.monitoring.yml up -d${NC}"
echo -e "2. Enable systemd service: ${YELLOW}systemctl enable tourist-rewards-api${NC}"
echo -e "3. Start API service: ${YELLOW}systemctl start tourist-rewards-api${NC}"
echo -e "4. Run health check: ${YELLOW}node scripts/production-health-check.js${NC}"
echo -e "5. Access Grafana: ${YELLOW}http://localhost:3001${NC} (admin/admin)"
echo -e "6. Test backup: ${YELLOW}./scripts/production-backup.sh${NC}"

echo -e "\n${BLUE}📊 Monitoring URLs:${NC}"
echo -e "  Prometheus: ${YELLOW}http://localhost:9090${NC}"
echo -e "  Grafana: ${YELLOW}http://localhost:3001${NC}"
echo -e "  Node Exporter: ${YELLOW}http://localhost:9100${NC}"

echo -e "\n${GREEN}🎉 Production monitoring is ready!${NC}"