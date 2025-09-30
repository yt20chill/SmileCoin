# Production Deployment Guide

This guide covers deploying the Tourist Rewards Blockchain Infrastructure to Polygon Mainnet for production use.

## ⚠️ CRITICAL WARNINGS

- **REAL MONEY**: Production deployment uses real MATIC tokens and incurs actual costs
- **SECURITY**: Ensure all security measures are in place before deployment
- **TESTING**: Thoroughly test on testnet before production deployment
- **BACKUPS**: Set up automated backups before going live
- **MONITORING**: Configure comprehensive monitoring and alerting

## Prerequisites

### Infrastructure Requirements
- **Server**: Minimum 4 CPU cores, 8GB RAM, 100GB SSD
- **Operating System**: Ubuntu 20.04 LTS or newer
- **Network**: Stable internet connection with low latency
- **SSL Certificate**: Valid SSL certificate for HTTPS

### Software Requirements
- Node.js 18+ and npm
- PostgreSQL 13+ with connection pooling
- Redis 6+ for caching and session management
- Nginx for reverse proxy and load balancing
- Docker and Docker Compose (optional)
- PM2 for process management

### Security Requirements
- **Firewall**: Properly configured firewall (UFW recommended)
- **SSH**: Key-based SSH authentication only
- **SSL/TLS**: HTTPS only with strong cipher suites
- **Database**: Encrypted connections and strong passwords
- **Secrets**: Secure secret management (HashiCorp Vault recommended)

### Financial Requirements
- **MATIC Tokens**: Minimum 5 MATIC for deployment and operations
- **Gas Fees**: Budget for ongoing transaction costs
- **Infrastructure**: Server hosting costs
- **Monitoring**: Third-party monitoring service costs

## Pre-Deployment Checklist

### Security Audit
- [ ] Smart contract security audit completed
- [ ] API security assessment completed
- [ ] Infrastructure security review completed
- [ ] Penetration testing completed
- [ ] Vulnerability scanning completed

### Testing Verification
- [ ] All unit tests pass
- [ ] Integration tests pass on testnet
- [ ] End-to-end tests pass on testnet
- [ ] Load testing completed
- [ ] Stress testing completed
- [ ] Disaster recovery testing completed

### Operational Readiness
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures tested
- [ ] Incident response plan documented
- [ ] On-call rotation established
- [ ] Documentation updated and reviewed
- [ ] Team training completed

### Compliance and Legal
- [ ] Legal review completed
- [ ] Compliance requirements met
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Data protection measures implemented

## Production Deployment Process

### Phase 1: Environment Setup

#### 1.1 Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nodejs npm postgresql-client redis-tools nginx ufw fail2ban

# Create application user
sudo useradd -m -s /bin/bash tourist-rewards
sudo usermod -aG sudo tourist-rewards

# Create application directory
sudo mkdir -p /opt/tourist-rewards
sudo chown tourist-rewards:tourist-rewards /opt/tourist-rewards
```

#### 1.2 Security Configuration

```bash
# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

#### 1.3 Database Setup

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres createdb tourist_rewards_production
sudo -u postgres createuser --interactive tourist_rewards

# Configure PostgreSQL
sudo nano /etc/postgresql/13/main/postgresql.conf
# Set: max_connections = 100, shared_buffers = 256MB

sudo systemctl restart postgresql
```

#### 1.4 SSL Certificate Setup

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Phase 2: Application Deployment

#### 2.1 Download and Extract Production Package

```bash
# Switch to application user
sudo su - tourist-rewards

# Download production package
cd /opt/tourist-rewards
wget https://your-deployment-server.com/production-package-YYYYMMDD-HHMMSS.tar.gz
tar -xzf production-package-*.tar.gz
mv production-package-*/* .
```

#### 2.2 Configure Environment

```bash
# Copy and configure production environment
cp .env.production.example .env.production
nano .env.production

# Set secure values for:
# - ADMIN_PRIVATE_KEY (your funded mainnet wallet)
# - API_KEY_SECRET (generate strong random key)
# - WALLET_SEED (generate strong random seed)
# - DATABASE_URL (production database connection)
# - All other production-specific settings
```

#### 2.3 Install Dependencies

```bash
# Install production dependencies
npm ci --only=production

# Set up database
psql $DATABASE_URL -f database/init.sql
```

#### 2.4 Deploy Smart Contracts

```bash
# Deploy to Polygon Mainnet
./scripts/deploy-production.sh

# This will:
# - Verify all prerequisites
# - Deploy SmileCoin contract to Polygon Mainnet
# - Update environment with contract address
# - Create deployment backup
# - Generate production package
```

### Phase 3: Service Configuration

#### 3.1 Set Up Process Management

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'tourist-rewards-api',
    script: 'dist/api/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/api-error.log',
    out_file: 'logs/api-out.log',
    log_file: 'logs/api-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3.2 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tourist-rewards

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/tourist-rewards /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Phase 4: Monitoring and Logging

#### 4.1 Set Up Monitoring

```bash
# Run monitoring setup script
./scripts/setup-production-monitoring.sh

# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Configure Grafana dashboards
# Access http://your-domain.com:3001 (admin/admin)
```

#### 4.2 Configure Log Management

```bash
# Set up log rotation
sudo nano /etc/logrotate.d/tourist-rewards

# Configure centralized logging (optional)
# Set up ELK stack or similar for log aggregation
```

#### 4.3 Set Up Alerting

```bash
# Configure Prometheus alerting
# Set up PagerDuty, Slack, or email notifications
# Test alert delivery
```

### Phase 5: Final Verification

#### 5.1 Health Checks

```bash
# Run comprehensive health check
node scripts/production-health-check.js

# Verify all systems are operational
curl https://your-domain.com/health
curl https://your-domain.com/api/blockchain/network/status
```

#### 5.2 Load Testing

```bash
# Run load tests against production
npm run test:load

# Monitor system performance during load test
# Verify auto-scaling works correctly
```

#### 5.3 Backup Verification

```bash
# Test backup system
./scripts/production-backup.sh

# Verify backup integrity
# Test restore procedure
```

## Post-Deployment Operations

### Daily Operations

#### Morning Checklist
- [ ] Check system health dashboard
- [ ] Review overnight alerts and logs
- [ ] Verify backup completion
- [ ] Check admin wallet balance
- [ ] Monitor transaction volumes

#### Evening Checklist
- [ ] Review daily metrics
- [ ] Check error rates and performance
- [ ] Verify all services running
- [ ] Review security logs
- [ ] Plan next day maintenance

### Weekly Operations

- [ ] Review weekly performance reports
- [ ] Update security patches
- [ ] Review and rotate logs
- [ ] Test backup restore procedure
- [ ] Review capacity planning

### Monthly Operations

- [ ] Security audit and review
- [ ] Performance optimization review
- [ ] Disaster recovery testing
- [ ] Documentation updates
- [ ] Team training and knowledge sharing

## Monitoring and Alerting

### Key Metrics to Monitor

#### Application Metrics
- API response times and error rates
- Transaction success/failure rates
- Database connection pool usage
- Memory and CPU utilization
- Active user sessions

#### Blockchain Metrics
- Contract transaction costs
- Admin wallet balance
- Network latency and availability
- Smart contract event processing
- Gas price fluctuations

#### Infrastructure Metrics
- Server resource utilization
- Database performance
- Network bandwidth usage
- SSL certificate expiration
- Disk space usage

### Alert Thresholds

#### Critical Alerts (Immediate Response)
- API error rate > 5%
- Database connection failures
- Admin wallet balance < 0.5 MATIC
- SSL certificate expires in < 7 days
- Disk usage > 90%

#### Warning Alerts (Response within 1 hour)
- API response time > 2 seconds
- Memory usage > 80%
- Transaction failure rate > 2%
- Admin wallet balance < 2 MATIC
- Unusual traffic patterns

## Security Best Practices

### Ongoing Security Measures

#### Access Control
- Regular access review and cleanup
- Multi-factor authentication for all admin accounts
- Principle of least privilege
- Regular password rotation
- Secure API key management

#### Network Security
- Regular firewall rule review
- VPN access for administrative tasks
- DDoS protection and rate limiting
- Regular security scanning
- Network segmentation

#### Application Security
- Regular dependency updates
- Security header configuration
- Input validation and sanitization
- SQL injection prevention
- XSS protection

#### Data Protection
- Encryption at rest and in transit
- Regular backup testing
- Data retention policies
- GDPR compliance measures
- Secure data disposal

## Disaster Recovery

### Backup Strategy

#### Automated Backups
- Database: Daily full backup, hourly incremental
- Configuration: Daily backup of all config files
- Logs: Weekly archive to long-term storage
- Code: Git repository with tagged releases

#### Backup Testing
- Monthly restore testing
- Quarterly disaster recovery drills
- Annual full system recovery test
- Documentation of recovery procedures

### Recovery Procedures

#### Service Outage Response
1. Assess impact and scope
2. Implement immediate mitigation
3. Communicate with stakeholders
4. Execute recovery plan
5. Post-incident review

#### Data Loss Response
1. Stop all write operations
2. Assess data loss extent
3. Restore from latest backup
4. Verify data integrity
5. Resume operations gradually

## Scaling Considerations

### Horizontal Scaling

#### Load Balancing
- Multiple API server instances
- Database read replicas
- Redis clustering
- CDN for static assets

#### Auto-scaling
- Container orchestration (Kubernetes)
- Auto-scaling groups
- Load-based scaling triggers
- Cost optimization

### Vertical Scaling

#### Resource Optimization
- Database query optimization
- Caching strategy improvements
- Code performance optimization
- Infrastructure upgrades

## Compliance and Legal

### Regulatory Compliance
- Data protection regulations (GDPR, CCPA)
- Financial services regulations
- Blockchain and cryptocurrency regulations
- Industry-specific compliance requirements

### Documentation Requirements
- System architecture documentation
- Security policies and procedures
- Incident response procedures
- Data handling and privacy policies
- Audit trails and logging

## Support and Maintenance

### Support Channels
- 24/7 monitoring and alerting
- On-call rotation schedule
- Escalation procedures
- Vendor support contacts
- Community support resources

### Maintenance Windows
- Scheduled maintenance windows
- Emergency maintenance procedures
- Change management process
- Rollback procedures
- Communication protocols

## Cost Management

### Cost Monitoring
- Infrastructure costs
- Transaction fees (gas costs)
- Third-party service costs
- Monitoring and alerting costs
- Support and maintenance costs

### Cost Optimization
- Resource utilization optimization
- Reserved instance planning
- Gas fee optimization strategies
- Vendor contract negotiations
- Regular cost reviews

## Conclusion

Production deployment of the Tourist Rewards System requires careful planning, thorough testing, and ongoing operational excellence. This guide provides a comprehensive framework for successful deployment and operation.

### Key Success Factors
1. **Thorough Testing**: Complete all testing phases before production
2. **Security First**: Implement comprehensive security measures
3. **Monitoring**: Set up comprehensive monitoring and alerting
4. **Documentation**: Maintain up-to-date operational documentation
5. **Team Readiness**: Ensure team is trained and prepared for operations

### Next Steps After Deployment
1. Monitor system performance and user adoption
2. Gather feedback and plan improvements
3. Scale infrastructure based on demand
4. Implement additional features and optimizations
5. Maintain security and compliance posture

For additional support or questions, refer to the operational runbooks and contact the development team.