#!/bin/bash

echo "🚀 Deploying Retail Chatbot to AWS..."

# Create DynamoDB table
echo "📊 Creating DynamoDB table..."
aws dynamodb create-table \
    --table-name retail-chatbot-analytics \
    --attribute-definitions \
        AttributeName=pk,AttributeType=S \
        AttributeName=sk,AttributeType=S \
    --key-schema \
        AttributeName=pk,KeyType=HASH \
        AttributeName=sk,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1

# Create Lambda deployment package
echo "📦 Creating Lambda deployment package..."
zip -r chatbot-lambda.zip . -x "*.git*" "node_modules/*" "uploads/*" "*.sh"

# Create Lambda function
echo "⚡ Creating Lambda function..."
aws lambda create-function \
    --function-name retail-chatbot \
    --runtime nodejs18.x \
    --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
    --handler server.handler \
    --zip-file fileb://chatbot-lambda.zip \
    --environment Variables='{
        "AWS_REGION":"us-east-1",
        "DYNAMODB_TABLE":"retail-chatbot-analytics"
    }' \
    --timeout 30 \
    --memory-size 512

# Create API Gateway
echo "🌐 Setting up API Gateway..."
aws apigateway create-rest-api \
    --name retail-chatbot-api \
    --description "API for Retail Chatbot"

echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "1. Configure your AWS credentials"
echo "2. Update IAM roles with proper permissions"
echo "3. Set up Lex bot for voice processing"
echo "4. Configure API Gateway endpoints"
