# Quick Start - 3 Steps

## 1. Set AWS Credentials
```bash
aws configure
```
Enter your AWS Access Key ID and Secret Access Key

## 2. Create IAM Policy
1. Go to AWS Console → IAM → Policies → Create Policy
2. Click JSON tab
3. Copy contents from `iam-policy.json` file
4. Name it: `RetailChatbotPolicy`
5. Attach to your user/role

## 3. Enable Bedrock Model
1. Go to AWS Bedrock Console
2. Click "Model access" 
3. Enable: **Amazon Nova Lite**
4. Click "Save changes"

## Run Application
```bash
npm install
npm run setup
npm start
```

Visit: http://localhost:9000

**Cost**: ~$2-5/month for 1000 interactions