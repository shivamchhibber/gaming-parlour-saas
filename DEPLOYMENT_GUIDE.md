# Gaming Parlour SaaS Deployment Guide

This guide will walk you through deploying the Gaming Parlour SaaS backend to DigitalOcean's App Platform.

# CI/CD Setup with GitHub Actions

## Prerequisites for CI/CD

1. SSH access to your DigitalOcean Droplet
2. A GitHub repository for your project
3. GitHub Actions enabled for your repository

## Setting Up CI/CD

### 1. Generate SSH Key Pair

On your local machine, generate a new SSH key pair if you don't have one:

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 2. Add Public Key to Droplet

1. Copy the public key (`~/.ssh/id_ed25519.pub` or `~/.ssh/id_rsa.pub`)
2. SSH into your Droplet:
   ```bash
   ssh root@YOUR_DROPLET_IP
   ```
3. Add the public key to `~/.ssh/authorized_keys`

### 3. Add Secrets to GitHub Repository

Go to your GitHub repository > Settings > Secrets > Actions

Add these secrets:
- `DROPLET_IP`: Your Droplet's IP address (167.71.229.81)
- `SSH_PRIVATE_KEY`: The private key that matches the public key you added to the Droplet

### 4. Push to Trigger Deployment

Now, whenever you push to the `main` branch, the GitHub Action will automatically:
1. Connect to your Droplet via SSH
2. Pull the latest changes
3. Rebuild and restart the Docker containers

---

# DigitalOcean App Platform Deployment Guide

## Prerequisites

1. A DigitalOcean account (Sign up at [https://cloud.digitalocean.com](https://cloud.digitalocean.com))
2. Git installed on your local machine
3. Python 3.8+ installed locally
4. A GitHub, GitLab, or Bitbucket account with your code pushed to a repository

## Step 1: Create a New App on DigitalOcean

1. Log in to your DigitalOcean account
2. Click on the "Create" button and select "Apps"
3. Choose your repository provider (GitHub, GitLab, or Bitbucket)
4. Select the repository containing your code
5. Choose the branch you want to deploy (usually `main` or `master`)

## Step 2: Configure App Settings

### Basic Information
- **Name**: gaming-parlour-backend (or your preferred name)
- **Region**: Choose a region closest to your users
- **Environment Variables**:
  - `DATABASE_URL`: (Will be set up in the next step)
  - `SECRET_KEY`: Generate a strong secret key (you can use `openssl rand -hex 32`)
  - `ENVIRONMENT`: production
  - `DEBUG`: false
  - `FRONTEND_URL`: Your frontend URL (e.g., https://your-frontend-domain.com)
  - `RAZORPAY_KEY_ID`: Your Razorpay key ID (if using Razorpay)
  - `RAZORPAY_KEY_SECRET`: Your Razorpay key secret (if using Razorpay)

### Build & Run Commands
- **Build Command**: `pip install -r requirements.txt`
- **Run Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind :8080`
- **HTTP Port**: 8080

## Step 3: Set Up a PostgreSQL Database

1. In the DigitalOcean dashboard, go to "Databases"
2. Click "Create" and select "Database Cluster"
3. Choose PostgreSQL
4. Select the same region as your app
5. Choose a plan (Start with the smallest plan and scale up as needed)
6. Create the database
7. Once created, go to the database dashboard and:
   - Create a database (e.g., `gameparlour`)
   - Create a user with all privileges
   - Note the connection details

## Step 4: Connect Database to Your App

1. In your app's settings, go to "Components"
2. Click "Edit" on your service
3. Go to the "Resources" tab
4. Under "Databases", select your newly created database
5. DigitalOcean will automatically add the `DATABASE_URL` environment variable

## Step 5: Update Environment Variables

Update the following environment variables in your app settings:

```
DATABASE_URL=postgresql://user:password@host:port/dbname
SECRET_KEY=your-secret-key
ENVIRONMENT=production
DEBUG=false
FRONTEND_URL=your-frontend-url
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

## Step 6: Deploy Your App

1. After saving all settings, DigitalOcean will automatically trigger a new deployment
2. You can monitor the deployment progress in the "Deployments" tab
3. Once deployed, your app will be available at `https://your-app-name.ondigitalocean.app`

## Step 7: Set Up Custom Domain (Optional)

1. Go to "Settings" > "Domains"
2. Click "Add Domain"
3. Enter your custom domain (e.g., api.yourdomain.com)
4. Follow the instructions to update your DNS records

## Step 8: Set Up SSL/TLS

DigitalOcean automatically provisions SSL certificates for your custom domains through Let's Encrypt.

## Step 9: Configure Backups (Recommended)

1. Go to your database in the DigitalOcean dashboard
2. Click on "Backups"
3. Enable automated backups
4. Set your preferred backup window

## Troubleshooting

- Check the logs in the DigitalOcean dashboard under "Logs"
- Ensure all environment variables are set correctly
- Verify database connection details
- Check if the database migrations have run successfully

## Next Steps

1. Set up monitoring and alerts
2. Configure auto-scaling if needed
3. Set up a CI/CD pipeline for automated deployments
4. Configure logging and monitoring solutions
