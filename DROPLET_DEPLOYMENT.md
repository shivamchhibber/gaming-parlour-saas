# DigitalOcean Droplet Deployment Guide

This guide will walk you through deploying the Gaming Parlour SaaS backend to a DigitalOcean Droplet.

## Prerequisites

1. A DigitalOcean account (Sign up at [https://cloud.digitalocean.com](https://cloud.digitalocean.com))
2. A domain name (optional but recommended)
3. Basic knowledge of Linux command line

## Step 1: Create a DigitalOcean Droplet

1. Log in to your DigitalOcean account
2. Click "Create" and select "Droplets"
3. Choose an image:
   - **Distribution**: Ubuntu 22.04 LTS
   - **Plan**: Basic (Start with the $6/month plan, scale up as needed)
   - **CPU Options**: Regular Intel/AMD
4. Choose a datacenter region closest to your users
5. Authentication:
   - **SSH Keys**: Add your SSH key (recommended)
   - **Password**: Set a strong root password
6. Finalize and create the Droplet

## Step 2: Connect to Your Droplet

1. Once the Droplet is created, note its IP address
2. Connect via SSH:
   ```bash
   ssh root@your_droplet_ip
   ```

## Step 3: Initial Server Setup

1. Update the package list and upgrade installed packages:
   ```bash
   apt update && apt upgrade -y
   ```

2. Install basic dependencies:
   ```bash
   apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib git
   ```

3. Install Node.js (for building frontend assets if needed):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt install -y nodejs
   ```

## Step 4: Set Up PostgreSQL Database

1. Switch to the postgres user:
   ```bash
   sudo -u postgres psql
   ```

2. Create a database and user:
   ```sql
   CREATE DATABASE gameparlour;
   CREATE USER gameparlouruser WITH PASSWORD 'your_secure_password';
   ALTER ROLE gameparlouruser SET client_encoding TO 'utf8';
   ALTER ROLE gameparlouruser SET default_transaction_isolation TO 'read committed';
   ALTER ROLE gameparlouruser SET timezone TO 'UTC';
   GRANT ALL PRIVILEGES ON DATABASE gameparlour TO gameparlouruser;
   \q
   ```

## Step 5: Set Up the Application

1. Create a system user for the application:
   ```bash
   adduser --system --group gameparlour
   ```

2. Create the application directory:
   ```bash
   mkdir -p /var/www/gaming-parlour/backend
   ```

3. Clone your repository (or upload your code):
   ```bash
   cd /var/www/gaming-parlour
   git clone https://github.com/your-username/your-repo.git .
   ```

4. Set up a Python virtual environment:
   ```bash
   python3 -m venv /var/www/gaming-parlour/venv
   source /var/www/gaming-parlour/venv/bin/activate
   pip install --upgrade pip
   pip install -r /var/www/gaming-parlour/backend/requirements.txt
   ```

5. Create a `.env` file with your configuration:
   ```bash
   nano /var/www/gaming-parlour/backend/.env
   ```
   Add the following (update with your values):
   ```
   DATABASE_URL=postgresql://gameparlouruser:your_secure_password@localhost/gameparlour
   SECRET_KEY=your-secret-key
   ENVIRONMENT=production
   DEBUG=False
   FRONTEND_URL=https://your-frontend-domain.com
   RAZORPAY_KEY_ID=your-razorpay-key
   RAZORPAY_KEY_SECRET=your-razorpay-secret
   ```

6. Set proper permissions:
   ```bash
   chown -R gameparlour:gameparlour /var/www/gaming-parlour
   chmod -R 755 /var/www/gaming-parlour
   ```

## Step 6: Set Up Gunicorn

1. Create a Gunicorn systemd service:
   ```bash
   nano /etc/systemd/system/gameparlour.service
   ```

2. Add the following configuration:
   ```ini
   [Unit]
   Description=Gaming Parlour Gunicorn Service
   After=network.target

   [Service]
   User=gameparlour
   Group=www-data
   WorkingDirectory=/var/www/gaming-parlour/backend
   Environment="PATH=/var/www/gaming-parlour/venv/bin"
   ExecStart=/var/www/gaming-parlour/venv/bin/gunicorn --workers 3 --bind unix:/var/www/gaming-parlour/gameparlour.sock -m 007 main:app
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

3. Start and enable the service:
   ```bash
   systemctl start gameparlour
   systemctl enable gameparlour
   ```

## Step 7: Configure Nginx

1. Create an Nginx server block:
   ```bash
   nano /etc/nginx/sites-available/gameparlour
   ```

2. Add the following configuration (replace with your domain):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;

       location / {
           include proxy_params;
           proxy_pass http://unix:/var/www/gaming-parlour/gameparlour.sock;
       }
   }
   ```

3. Enable the site and test the configuration:
   ```bash
   ln -s /etc/nginx/sites-available/gameparlour /etc/nginx/sites-enabled
   nginx -t
   systemctl restart nginx
   ```

## Step 8: Set Up SSL with Let's Encrypt

1. Install Certbot:
   ```bash
   apt install -y certbot python3-certbot-nginx
   ```

2. Obtain and install SSL certificate:
   ```bash
   certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. Set up automatic renewal:
   ```bash
   certbot renew --dry-run
   ```

## Step 9: Configure Firewall

1. Allow only necessary ports:
   ```bash
   ufw allow OpenSSH
   ufw allow 'Nginx Full'
   ufw enable
   ```

## Step 10: Final Steps

1. Apply database migrations:
   ```bash
   cd /var/www/gaming-parlour/backend
   source /var/www/gaming-parlour/venv/bin/activate
   python -c "from main import Base, engine; Base.metadata.create_all(bind=engine)"
   ```

2. Restart the services:
   ```bash
   systemctl restart gameparlour
   systemctl restart nginx
   ```

Your application should now be accessible at `http://your-domain.com` (or the IP address if you didn't set up a domain).

## Maintenance

- **Logs**: Check application logs with `journalctl -u gameparlour`
- **Updates**: Pull the latest code and restart the service
- **Backups**: Set up regular database backups

## Troubleshooting

- Check Nginx error logs: `tail -f /var/log/nginx/error.log`
- Check Gunicorn logs: `journalctl -u gameparlour`
- Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-*-main.log`
