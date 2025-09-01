# CORS Fix Guide

## Current CORS Configuration

Your backend now allows the following origins:
- `http://localhost:3000` (local development)
- `http://127.0.0.1:3000` (local development)
- `https://gp.botarmy.tech` (production frontend)

## If CORS Issues Persist

### Option 1: Allow All Origins (Temporary Fix)

Edit the environment file on the droplet:
```bash
# SSH to droplet
ssh root@167.71.229.81

# Edit the environment file
nano /root/game-parlour-backend/.env

# Add this line:
CORS_ALLOW_ALL_ORIGINS=True

# Restart the service
systemctl restart game-parlour.service
```

### Option 2: Update Allowed Origins

Edit the environment file on the droplet:
```bash
# SSH to droplet
ssh root@167.71.229.81

# Edit the environment file
nano /root/game-parlour-backend/.env

# Update this line to include your domain:
ALLOWED_ORIGINS=https://gp.botarmy.tech,http://localhost:3000,http://127.0.0.1:3000

# Restart the service
systemctl restart game-parlour.service
```

### Option 3: Test CORS Headers

Test if CORS is working:
```bash
# Test from your local machine
curl -H "Origin: https://gp.botarmy.tech" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://api.botarmy.tech/
```

## Expected Response

If CORS is working, you should see:
- `Access-Control-Allow-Origin: https://gp.botarmy.tech`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: *`

## Troubleshooting

1. **Check nginx logs**: `tail -f /var/log/nginx/error.log`
2. **Check backend logs**: `journalctl -u game-parlour.service -f`
3. **Verify nginx proxy**: Make sure nginx is forwarding requests to port 8000
4. **Check Cloudflare**: Ensure the domain is pointing to the correct IP
