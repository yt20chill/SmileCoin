#!/bin/bash
# create-production-package.sh - Create production deployment package

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Creating Production Deployment Package${NC}"
echo -e "${BLUE}=======================================${NC}"

# Get version from package.json or use timestamp
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || date +%Y%m%d-%H%M%S)
PACKAGE_NAME="tourist-rewards-production-v${VERSION}"
PACKAGE_DIR="packages/${PACKAGE_NAME}"

echo -e "Package: ${YELLOW}${PACKAGE_NAME}${NC}"
echo -e "Version: ${YELLOW}${VERSION}${NC}"

# Create package directory
echo -e "\n${BLUE}📁 Creating package structure...${NC}"
mkdir -p "$PACKAGE_DIR"
mkdir -p packages

# Check if application is built
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  Application not built. Building now...${NC}"
    npm run build
fi

# Copy application files
echo -e "\n${BLUE}📋 Copying application files...${NC}"
cp -r dist "$PACKAGE_DIR/"
cp -r database "$PACKAGE_DIR/"
cp -r nginx "$PACKAGE_DIR/"
cp -r monitoring "$PACKAGE_DIR/" 2>/dev/null || echo "  ⚠️  Monitoring directory not found, skipping..."

# Copy configuration files
echo -e "\n${BLUE}⚙️  Copying configuration files...${NC}"
cp package.json "$PACKAGE_DIR/"
cp package-lock.json "$PACKAGE_DIR/"
cp .env.production "$PACKAGE_DIR/.env.production.example"
cp docker-compose.production.yml "$PACKAGE_DIR/"
cp docker-compose.monitoring.yml "$PACKAGE_DIR/" 2>/dev/null || true

# Copy deployment scripts
echo -e "\n${BLUE}🚀 Copying deployment scripts...${NC}"
mkdir -p "$PACKAGE_DIR/scripts"
cp scripts/deploy-production.sh "$PACKAGE_DIR/scripts/"
cp scripts/setup-production-monitoring.sh "$PACKAGE_DIR/scripts/"
cp scripts/production-health-check.js "$PACKAGE_DIR/scripts/"
cp scripts/production-backup.sh "$PACKAGE_DIR/scripts/"
cp scripts/health-check.js "$PACKAGE_DIR/scripts/"

# Make scripts executable
chmod +x "$PACKAGE_DIR/scripts"/*.sh

# Copy documentation
echo -e "\n${BLUE}📚 Copying documentation...${NC}"
mkdir -p "$PACKAGE_DIR/docs"
cp docs/PRODUCTION_DEPLOYMENT.md "$PACKAGE_DIR/docs/"
cp docs/PRODUCTION_READINESS_CHECKLIST.md "$PACKAGE_DIR/docs/"
cp docs/API_DOCUMENTATION.md "$PACKAGE_DIR/docs/"
cp docs/TROUBLESHOOTING.md "$PACKAGE_DIR/docs/"
cp docs/MONITORING.md "$PACKAGE_DIR/docs/"
cp README.md "$PACKAGE_DIR/"

# Create production-specific README
echo -e "\n${BLUE}📝 Creating production README...${NC}"
cat > "$PACKAGE_DIR/README-PRODUCTION.md" << EOF
# Tourist Rewards System - Production Package v${VERSION}

This package contains the production-ready Tourist Rewards Blockchain Infrastructure.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 13+
- Redis 6+
- Nginx
- SSL certificate
- Minimum 5 MATIC tokens for deployment

### Deployment Steps

1. **Extract Package**
   \`\`\`bash
   tar -xzf ${PACKAGE_NAME}.tar.gz
   cd ${PACKAGE_NAME}
   \`\`\`

2. **Configure Environment**
   \`\`\`bash
   cp .env.production.example .env.production
   # Edit .env.production with your settings
   \`\`\`

3. **Deploy to Production**
   \`\`\`bash
   ./scripts/deploy-production.sh
   \`\`\`

4. **Set Up Monitoring**
   \`\`\`bash
   ./scripts/setup-production-monitoring.sh
   \`\`\`

5. **Verify Deployment**
   \`\`\`bash
   node scripts/production-health-check.js
   \`\`\`

## 📋 Package Contents

### Application Files
- \`dist/\` - Built application code
- \`database/\` - Database schema and migrations
- \`nginx/\` - Nginx configuration files
- \`monitoring/\` - Monitoring and alerting configuration

### Configuration
- \`.env.production.example\` - Production environment template
- \`docker-compose.production.yml\` - Production Docker setup
- \`docker-compose.monitoring.yml\` - Monitoring stack setup

### Scripts
- \`deploy-production.sh\` - Main production deployment script
- \`setup-production-monitoring.sh\` - Monitoring setup script
- \`production-health-check.js\` - Health check script
- \`production-backup.sh\` - Backup script

### Documentation
- \`docs/PRODUCTION_DEPLOYMENT.md\` - Comprehensive deployment guide
- \`docs/PRODUCTION_READINESS_CHECKLIST.md\` - Pre-deployment checklist
- \`docs/API_DOCUMENTATION.md\` - API reference
- \`docs/TROUBLESHOOTING.md\` - Troubleshooting guide
- \`docs/MONITORING.md\` - Monitoring and alerting guide

## ⚠️ Important Notes

- **SECURITY**: This package is for production use with real MATIC tokens
- **TESTING**: Ensure thorough testing on testnet before production deployment
- **BACKUP**: Set up automated backups before going live
- **MONITORING**: Configure comprehensive monitoring and alerting
- **SUPPORT**: Have 24/7 support coverage ready

## 🔗 Resources

- **Contract Explorer**: https://polygonscan.com/
- **Network Status**: https://status.polygon.technology/
- **Documentation**: See docs/ directory
- **Support**: Contact development team

## 📊 System Requirements

### Minimum Requirements
- 4 CPU cores
- 8GB RAM
- 100GB SSD storage
- Stable internet connection

### Recommended Requirements
- 8 CPU cores
- 16GB RAM
- 500GB SSD storage
- Load balancer
- CDN

## 🛡️ Security Considerations

- Use hardware wallet or HSM for admin private key
- Enable firewall and fail2ban
- Configure SSL/TLS with strong ciphers
- Set up intrusion detection
- Regular security updates
- Monitor for unusual activity

## 📈 Scaling Considerations

- Configure auto-scaling
- Set up database read replicas
- Use Redis clustering
- Implement CDN for static assets
- Monitor performance metrics
- Plan capacity upgrades

---

**Package Version**: ${VERSION}  
**Build Date**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")  
**Node.js Version**: $(node --version)  
**NPM Version**: $(npm --version)  

For detailed deployment instructions, see \`docs/PRODUCTION_DEPLOYMENT.md\`
EOF

# Create deployment manifest
echo -e "\n${BLUE}📄 Creating deployment manifest...${NC}"
cat > "$PACKAGE_DIR/deployment-manifest.json" << EOF
{
  "package": {
    "name": "tourist-rewards-production",
    "version": "${VERSION}",
    "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "nodeVersion": "$(node --version)",
    "npmVersion": "$(npm --version)"
  },
  "contents": {
    "application": [
      "dist/",
      "package.json",
      "package-lock.json"
    ],
    "infrastructure": [
      "database/",
      "nginx/",
      "monitoring/",
      "docker-compose.production.yml",
      "docker-compose.monitoring.yml"
    ],
    "scripts": [
      "scripts/deploy-production.sh",
      "scripts/setup-production-monitoring.sh",
      "scripts/production-health-check.js",
      "scripts/production-backup.sh",
      "scripts/health-check.js"
    ],
    "configuration": [
      ".env.production.example"
    ],
    "documentation": [
      "README.md",
      "README-PRODUCTION.md",
      "docs/PRODUCTION_DEPLOYMENT.md",
      "docs/PRODUCTION_READINESS_CHECKLIST.md",
      "docs/API_DOCUMENTATION.md",
      "docs/TROUBLESHOOTING.md",
      "docs/MONITORING.md"
    ]
  },
  "requirements": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0",
    "postgresql": ">=13.0.0",
    "redis": ">=6.0.0",
    "nginx": ">=1.18.0"
  },
  "deployment": {
    "network": "polygon",
    "chainId": 137,
    "minimumMatic": 5,
    "estimatedDeploymentTime": "30-60 minutes",
    "supportedOS": ["Ubuntu 20.04+", "CentOS 8+", "RHEL 8+"]
  },
  "checksum": {
    "algorithm": "sha256",
    "value": "$(find "$PACKAGE_DIR" -type f -exec sha256sum {} + | sha256sum | cut -d' ' -f1)"
  }
}
EOF

# Create installation script
echo -e "\n${BLUE}🔧 Creating installation script...${NC}"
cat > "$PACKAGE_DIR/install.sh" << 'EOF'
#!/bin/bash
# install.sh - Production installation script

set -e

echo "🚀 Installing Tourist Rewards System (Production)"
echo "================================================"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Do not run this script as root"
    exit 1
fi

# Check system requirements
echo "🔍 Checking system requirements..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
if ! node -e "process.exit(process.version.match(/^v(\d+)/)[1] >= 18 ? 0 : 1)"; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client not found. Please install PostgreSQL 13+"
    exit 1
fi

echo "✅ PostgreSQL client found"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found"
    echo "💡 Please copy .env.production.example to .env.production and configure it"
    exit 1
fi

echo "✅ Environment configuration found"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

echo "✅ Dependencies installed"

# Make scripts executable
chmod +x scripts/*.sh

echo "🎉 Installation completed successfully!"
echo ""
echo "Next steps:"
echo "1. Review and update .env.production configuration"
echo "2. Run: ./scripts/deploy-production.sh"
echo "3. Run: ./scripts/setup-production-monitoring.sh"
echo "4. Run: node scripts/production-health-check.js"
echo ""
echo "For detailed instructions, see docs/PRODUCTION_DEPLOYMENT.md"
EOF

chmod +x "$PACKAGE_DIR/install.sh"

# Create verification script
echo -e "\n${BLUE}🔍 Creating verification script...${NC}"
cat > "$PACKAGE_DIR/verify-package.sh" << 'EOF'
#!/bin/bash
# verify-package.sh - Verify package integrity

set -e

echo "🔍 Verifying package integrity..."

# Check manifest exists
if [ ! -f "deployment-manifest.json" ]; then
    echo "❌ Deployment manifest not found"
    exit 1
fi

# Verify all required files exist
echo "📋 Checking required files..."

required_files=(
    "dist/api/app.js"
    "package.json"
    "database/init.sql"
    "scripts/deploy-production.sh"
    "scripts/production-health-check.js"
    ".env.production.example"
    "docs/PRODUCTION_DEPLOYMENT.md"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ] && [ ! -d "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

echo "✅ All required files present"

# Verify scripts are executable
echo "🔧 Checking script permissions..."
for script in scripts/*.sh; do
    if [ ! -x "$script" ]; then
        echo "❌ Script not executable: $script"
        exit 1
    fi
done

echo "✅ All scripts executable"

# Verify package.json
echo "📦 Verifying package.json..."
if ! node -e "require('./package.json')" 2>/dev/null; then
    echo "❌ Invalid package.json"
    exit 1
fi

echo "✅ package.json valid"

echo "🎉 Package verification completed successfully!"
EOF

chmod +x "$PACKAGE_DIR/verify-package.sh"

# Create package archive
echo -e "\n${BLUE}📦 Creating package archive...${NC}"
cd packages
tar -czf "${PACKAGE_NAME}.tar.gz" "$PACKAGE_NAME"
cd ..

# Calculate checksums
echo -e "\n${BLUE}🔐 Calculating checksums...${NC}"
SHA256_HASH=$(sha256sum "packages/${PACKAGE_NAME}.tar.gz" | cut -d' ' -f1)
MD5_HASH=$(md5sum "packages/${PACKAGE_NAME}.tar.gz" | cut -d' ' -f1)

# Create checksum file
cat > "packages/${PACKAGE_NAME}.checksums" << EOF
# Tourist Rewards Production Package Checksums
# Package: ${PACKAGE_NAME}.tar.gz
# Created: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

SHA256: ${SHA256_HASH}
MD5: ${MD5_HASH}

# Verification:
# sha256sum -c ${PACKAGE_NAME}.checksums
# md5sum -c ${PACKAGE_NAME}.checksums
EOF

# Create package info file
echo -e "\n${BLUE}📊 Creating package information...${NC}"
PACKAGE_SIZE=$(du -h "packages/${PACKAGE_NAME}.tar.gz" | cut -f1)
FILE_COUNT=$(tar -tzf "packages/${PACKAGE_NAME}.tar.gz" | wc -l)

cat > "packages/${PACKAGE_NAME}.info" << EOF
# Tourist Rewards Production Package Information

Package Name: ${PACKAGE_NAME}
Version: ${VERSION}
Created: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Size: ${PACKAGE_SIZE}
Files: ${FILE_COUNT}
SHA256: ${SHA256_HASH}

## Contents
- Application code (dist/)
- Database schema (database/)
- Configuration files
- Deployment scripts
- Monitoring setup
- Documentation

## System Requirements
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Nginx
- Ubuntu 20.04+ or CentOS 8+
- Minimum 5 MATIC tokens

## Installation
1. Extract: tar -xzf ${PACKAGE_NAME}.tar.gz
2. Configure: cp .env.production.example .env.production
3. Install: ./install.sh
4. Deploy: ./scripts/deploy-production.sh

## Support
- Documentation: docs/
- Health Check: node scripts/production-health-check.js
- Troubleshooting: docs/TROUBLESHOOTING.md
EOF

echo -e "\n${GREEN}✅ Production package created successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"

echo -e "\n${BLUE}📦 Package Details:${NC}"
echo -e "  Name: ${YELLOW}${PACKAGE_NAME}${NC}"
echo -e "  Version: ${YELLOW}${VERSION}${NC}"
echo -e "  Size: ${YELLOW}${PACKAGE_SIZE}${NC}"
echo -e "  Files: ${YELLOW}${FILE_COUNT}${NC}"
echo -e "  Archive: ${YELLOW}packages/${PACKAGE_NAME}.tar.gz${NC}"

echo -e "\n${BLUE}🔐 Checksums:${NC}"
echo -e "  SHA256: ${YELLOW}${SHA256_HASH}${NC}"
echo -e "  MD5: ${YELLOW}${MD5_HASH}${NC}"

echo -e "\n${BLUE}📄 Package Files:${NC}"
echo -e "  📦 ${YELLOW}packages/${PACKAGE_NAME}.tar.gz${NC} - Main package archive"
echo -e "  🔐 ${YELLOW}packages/${PACKAGE_NAME}.checksums${NC} - Checksum verification"
echo -e "  📊 ${YELLOW}packages/${PACKAGE_NAME}.info${NC} - Package information"

echo -e "\n${BLUE}🚀 Next Steps:${NC}"
echo -e "1. Transfer package to production server"
echo -e "2. Verify checksums: ${YELLOW}sha256sum -c ${PACKAGE_NAME}.checksums${NC}"
echo -e "3. Extract package: ${YELLOW}tar -xzf ${PACKAGE_NAME}.tar.gz${NC}"
echo -e "4. Follow deployment guide: ${YELLOW}docs/PRODUCTION_DEPLOYMENT.md${NC}"

echo -e "\n${GREEN}🎉 Production package ready for deployment!${NC}"