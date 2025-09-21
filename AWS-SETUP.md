# AWS Setup Guide for Retail Chatbot

## 🔐 Step 1: Configure AWS Credentials

Choose ONE of these methods:

### Option A: AWS CLI (Recommended)
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region (e.g., us-east-1)

### Option B: Environment Variables
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

### Option C: IAM Roles (Production)
Attach IAM role to EC2/Lambda with required permissions.

## 🎯 Step 2: Required AWS Permissions

Your AWS user/role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow", 
      "Action": [
        "rekognition:DetectLabels"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem", 
        "dynamodb:UpdateItem",
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/retail-chatbot-analytics"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lex:RecognizeUtterance"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🤖 Step 3: Enable Bedrock Models

1. Go to AWS Bedrock Console
2. Navigate to "Model access" 
3. Click "Enable specific models"
4. Enable: **Claude 3 Haiku** (`anthropic.claude-3-haiku-20240307-v1:0`)
5. Wait for approval (usually instant)

## ⚡ Step 4: Run Setup

```bash
npm run setup
```

This will:
- Test Bedrock access
- Create DynamoDB table
- Verify all permissions

## 🚀 Step 5: Start Application

```bash
npm start
```

## 🔧 Troubleshooting

### "Access Denied" Error
- Check IAM permissions above
- Verify AWS credentials are configured
- Ensure Bedrock model access is enabled

### "Model Not Found" Error  
- Enable Claude 3 Haiku in Bedrock console
- Check model ID: `anthropic.claude-3-haiku-20240307-v1:0`

### DynamoDB Errors
- Verify DynamoDB permissions
- Check table name in .env file

## 💰 Cost Estimation

- **Bedrock**: ~$0.25 per 1K tokens
- **Rekognition**: ~$1 per 1K images  
- **DynamoDB**: ~$1.25 per million requests
- **Lex**: ~$0.004 per voice request

**Estimated monthly cost for 10K interactions: $15-25**