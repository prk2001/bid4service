# Deploy Bid4Service to DigitalOcean

## Prerequisites
- DigitalOcean account (get $200 credit: https://m.do.co/c/your-referral)
- Basic Linux knowledge helpful
- Domain name (optional but recommended)

## Step 1: Create Droplet (Virtual Server)

1. **Log in to DigitalOcean**
2. Click "Create" → "Droplets"
3. **Choose Image:** Ubuntu 22.04 LTS
4. **Choose Plan:** 
   - Basic: $6/month (1GB RAM) - Good for development
   - Regular: $12/month (2GB RAM) - Good for production
5. **Choose Region:** Closest to your users
6. **Authentication:** SSH Key (recommended) or Password
7. **Hostname:** bid4service-api
8. Click "Create Droplet"

Wait 1-2 minutes for droplet to be created.

## Step 2: Connect to Your Server

```bash
# Get your droplet's IP from DigitalOcean dashboard
ssh root@YOUR_DROPLET_IP

# If using SSH key, you'll connect automatically
# If using password, enter the password emailed to you
```

## Step 3: Initial Server Setup

### Update System
```bash
apt update && apt upgrade -y
```

### Create Non-Root User
```bash
# Create user
adduser bid4service
usermod -aG sudo bid4service

# Switch to new user
su - bid4service
```

### Install Node.js 18
```bash
# Add Node.js repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

### Install PostgreSQL
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE bid4service_prod;
CREATE USER bid4service WITH ENCRYPTED PASSWORD 'your-secure-password-here';
GRANT ALL PRIVILEGES ON DATABASE bid4service_prod TO bid4service;
\q
```

### Install Nginx (Web Server)
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

## Step 4: Setup Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## Step 5: Deploy Your Application

### Clone Your Repository
```bash
# Install git if needed
sudo apt install -y git

# Clone your repo
cd ~
git clone https://github.com/YOUR_USERNAME/bid4service.git
cd bid4service/backend
```

### Install Dependencies
```bash
npm install
```

### Create Environment File
```bash
nano .env
```

Add this content:
```env
NODE_ENV=production
PORT=5000

DATABASE_URL="postgresql://bid4service:your-secure-password-here@localhost:5432/bid4service_prod"

JWT_SECRET=your-super-secure-random-64-char-string
JWT_EXPIRES_IN=7d

FRONTEND_URL=https://yourdomain.com

# Optional: Add these later
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
SENDGRID_API_KEY=your_key
FROM_EMAIL=noreply@yourdomain.com
```

Save with `Ctrl+X`, then `Y`, then `Enter`

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy this and use it as JWT_SECRET in .env
```

### Build Application
```bash
npm run build
```

### Run Database Migrations
```bash
npx prisma generate
npx prisma migrate deploy
```

### Test Application
```bash
# Start app temporarily
npm start

# In another terminal, test:
curl http://localhost:5000/health

# If it works, stop with Ctrl+C
```

## Step 6: Setup PM2 (Keep App Running)

```bash
# Start app with PM2
pm2 start dist/server.js --name bid4service-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it shows

# Check status
pm2 status
pm2 logs bid4service-api
```

**Useful PM2 Commands:**
```bash
pm2 restart bid4service-api  # Restart app
pm2 stop bid4service-api     # Stop app
pm2 logs bid4service-api     # View logs
pm2 monit                    # Monitor resources
```

## Step 7: Configure Nginx (Reverse Proxy)

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/bid4service
```

Add this content:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for long requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Save and exit.

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/bid4service /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 8: Setup SSL with Let's Encrypt (Free HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended)

# Test auto-renewal
sudo certbot renew --dry-run
```

Your API is now accessible at `https://api.yourdomain.com`!

## Step 9: Setup Database Backups

```bash
# Create backup directory
mkdir -p ~/backups

# Create backup script
nano ~/backup-db.sh
```

Add this:
```bash
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
PGPASSWORD='your-db-password' pg_dump -U bid4service bid4service_prod > $BACKUP_DIR/backup_$DATE.sql
# Delete backups older than 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Make it executable:
```bash
chmod +x ~/backup-db.sh
```

Schedule daily backups:
```bash
crontab -e

# Add this line (runs at 2 AM daily):
0 2 * * * ~/backup-db.sh
```

## Step 10: Monitoring Setup

### Install Monitoring Tools
```bash
# Install htop (system monitor)
sudo apt install -y htop

# View system resources
htop
```

### Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/bid4service
```

Add:
```
/home/bid4service/.pm2/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 bid4service bid4service
    sharedscripts
}
```

## Deployment Workflow

### For Code Updates:
```bash
cd ~/bid4service/backend

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild
npm run build

# Run migrations if needed
npx prisma migrate deploy

# Restart with PM2
pm2 restart bid4service-api
```

### Automated Deployment Script:
```bash
nano ~/deploy.sh
```

Add:
```bash
#!/bin/bash
cd ~/bid4service/backend
echo "Pulling latest changes..."
git pull origin main
echo "Installing dependencies..."
npm install
echo "Building..."
npm run build
echo "Running migrations..."
npx prisma migrate deploy
echo "Restarting application..."
pm2 restart bid4service-api
echo "Deployment complete!"
pm2 logs bid4service-api --lines 50
```

Make executable:
```bash
chmod +x ~/deploy.sh
```

Now deploy with: `./deploy.sh`

## Setup GitHub Actions for Auto-Deploy

Create `.github/workflows/deploy-do.yml` in your repo:
```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to DigitalOcean
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DO_HOST }}
          username: bid4service
          key: ${{ secrets.DO_SSH_KEY }}
          script: |
            cd ~/bid4service/backend
            git pull origin main
            npm install
            npm run build
            npx prisma migrate deploy
            pm2 restart bid4service-api
```

Add secrets in GitHub:
- `DO_HOST`: Your droplet IP
- `DO_SSH_KEY`: Your private SSH key

## Scaling & Optimization

### Optimize PostgreSQL
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Adjust these settings for your droplet size:
```
# For 2GB RAM droplet:
shared_buffers = 512MB
effective_cache_size = 1GB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Add Redis for Caching (Optional)
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Monitor Resource Usage
```bash
# Check disk space
df -h

# Check memory
free -m

# Check CPU
top

# Check app logs
pm2 logs bid4service-api --lines 100
```

## Security Best Practices

### Disable Root Login
```bash
sudo nano /etc/ssh/sshd_config

# Change this line:
PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd
```

### Setup Fail2Ban (Prevent Brute Force)
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Regular Updates
```bash
# Create update script
nano ~/update-system.sh
```

Add:
```bash
#!/bin/bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```

Schedule monthly:
```bash
crontab -e

# Add (runs first day of month at 3 AM):
0 3 1 * * ~/update-system.sh
```

## Troubleshooting

### App Won't Start
```bash
# Check PM2 logs
pm2 logs bid4service-api --err

# Check app can connect to database
cd ~/bid4service/backend
npx prisma studio  # Opens database GUI
```

### Database Connection Error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
psql -U bid4service -d bid4service_prod -h localhost
```

### Nginx Errors
```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues
```bash
# Renew certificates manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

## Costs

**Basic Setup ($21/month):**
- Droplet: $6/month (1GB RAM)
- Managed Database: $15/month (optional, use local PostgreSQL for cheaper)

**Production Setup ($42/month):**
- Droplet: $12/month (2GB RAM)
- Managed Database: $30/month (1GB)

**Or Cheaper ($6-12/month):**
- Single droplet with PostgreSQL: $6-12/month
- Perfect for MVP

---

## 🎉 Your API is Live on DigitalOcean!

**Access your API:**
- HTTP: `http://YOUR_DROPLET_IP`
- HTTPS: `https://api.yourdomain.com` (after SSL setup)

**Quick Commands:**
```bash
pm2 status              # Check app status
pm2 logs bid4service-api  # View logs
pm2 restart bid4service-api  # Restart app
./deploy.sh             # Deploy updates
```

---

## Resources
- DigitalOcean Tutorials: https://www.digitalocean.com/community/tutorials
- Node.js Production Guide: https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-22-04
