#!/bin/bash

# Exit on error
set -e

# Configuration
STACK_NAME="gaming-parlor-backend"
AWS_REGION="us-east-1"  # Change to your preferred region
S3_BUCKET="your-s3-bucket-name"  # Create this bucket first

# Install dependencies in a temporary directory
echo "Installing dependencies..."
pip install -r requirements-lambda.txt -t ./package

# Create deployment package
echo "Creating deployment package..."
cd package
zip -r ../deployment-package.zip .
cd ..

# Add your code to the package
zip -g deployment-package.zip lambda_handler.py

# Upload to S3
echo "Uploading to S3..."
aws s3 cp deployment-package.zip s3://$S3_BUCKET/

# Deploy with SAM
echo "Deploying with SAM..."
sam deploy \
    --template-file template.yaml \
    --stack-name $STACK_NAME \
    --s3-bucket $S3_BUCKET \
    --s3-prefix $STACK_NAME \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION \
    --no-confirm-changeset

echo "Deployment complete!"
echo "API URL: " $(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text)

# Clean up
rm -rf package deployment-package.zip
