# Gaming Parlor - Backend Deployment to AWS Lambda

This guide will help you deploy your FastAPI backend to AWS Lambda using API Gateway.

## Prerequisites

1. **AWS Account** - Sign up at [AWS Console](https://aws.amazon.com/)
2. **AWS CLI** - Install from [here](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
3. **AWS SAM CLI** - Install from [here](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
4. **Python 3.9+** - Download from [python.org](https://www.python.org/downloads/)

## Step 1: Configure AWS CLI

1. Open your terminal and run:
   ```bash
   aws configure
   ```
2. Enter your AWS Access Key ID and Secret Access Key
3. Set your default region (e.g., `us-east-1`)
4. Set default output format to `json`

## Step 2: Create an S3 Bucket

1. Go to AWS S3 Console
2. Click "Create bucket"
3. Enter a unique name (e.g., `gaming-parlor-deployments`)
4. Choose your region
5. Click "Create bucket"

## Step 3: Update Configuration Files

1. Open `template.yaml` and update:
   - `S3_BUCKET` with your bucket name
   - `AWS_REGION` with your preferred region

2. Update `lambda_handler.py` with your FastAPI routes

## Step 4: Install Dependencies

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements-lambda.txt
   ```

## Step 5: Deploy to AWS Lambda

1. Make the deploy script executable:
   ```bash
   chmod +x deploy.sh
   ```

2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

3. Wait for the deployment to complete (5-10 minutes)

## Step 6: Test Your API

1. After deployment, you'll see an API URL in the output
2. Test it in your browser or with curl:
   ```bash
   curl https://your-api-url/health
   ```
   Should return: `{"status": "healthy"}`

## Step 7: Set Up Custom Domain (Optional)

1. Go to API Gateway in AWS Console
2. Select your API
3. Go to "Custom Domain Names"
4. Click "Create Custom Domain Name"
5. Enter your domain (e.g., `api.yourdomain.com`)
6. Follow the instructions to configure DNS

## Troubleshooting

- **Deployment fails**: Check CloudFormation logs in AWS Console
- **API Gateway 500 error**: Check CloudWatch logs for your Lambda function
- **CORS issues**: Verify CORS settings in `template.yaml`

## Updating Your API

1. Make your code changes
2. Run the deploy script again:
   ```bash
   ./deploy.sh
   ```

## Clean Up

To delete all resources:
1. Go to CloudFormation in AWS Console
2. Select your stack
3. Click "Delete"
4. Empty and delete your S3 bucket

## Next Steps

1. Set up a CI/CD pipeline with GitHub Actions
2. Configure custom domain with HTTPS
3. Set up monitoring with CloudWatch
4. Implement authentication with Cognito
