# Deployment Script for Gaming Parlor Backend
# Prerequisites:
# 1. AWS CLI configured with appropriate permissions
# 2. EB CLI installed and configured
# 3. Python 3.8+ and pip installed

# Set environment variables
$APP_NAME = "gaming-parlour-backend"
$REGION = "your-region"  # e.g., us-east-1
$PROFILE = "your-aws-profile"

# Install dependencies
Write-Host "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Initialize EB CLI (if not already initialized)
if (-not (Test-Path ".elasticbeanstalk")) {
    Write-Host "Initializing Elastic Beanstalk..."
    eb init -p python-3.8 $APP_NAME --region $REGION --profile $PROFILE
}

# Create the Elastic Beanstalk environment (if it doesn't exist)
$envExists = eb list | Select-String -Pattern $APP_NAME
if (-not $envExists) {
    Write-Host "Creating Elastic Beanstalk environment..."
    eb create $APP_NAME --elb-type application --region $REGION --profile $PROFILE
}

# Configure environment variables from .env file
Write-Host "Setting environment variables..."
Get-Content .env | ForEach-Object {
    $name, $value = $_.split('=')
    if ($name -and $value) {
        eb setenv "$name=$value" --profile $PROFILE
    }
}

# Deploy the application
Write-Host "Deploying application..."
eb deploy --profile $PROFILE

# Show environment status and URL
Write-Host "Deployment complete!"
eb status --profile $PROFILE
$appUrl = eb status | Select-String -Pattern "CNAME"
Write-Host "Your application is now running at: $appUrl"
