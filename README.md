# 24/7 AI Chatbot for Retail Businesses - AWS Production Ready

## 🚀 AWS Services Integration

### Core AWS Services:
- ✅ **Amazon Bedrock**: Amazon Nova Lite for AI responses
- ✅ **Amazon Rekognition**: Image analysis and product identification
- ✅ **Amazon DynamoDB**: Analytics and data storage
- ✅ **AWS Lambda**: Serverless compute (production deployment)

### Features Implemented:
- ✅ **Real-time AI Chat**: Powered by Amazon Bedrock
- ✅ **Image Recognition**: Product identification and price comparison
- ✅ **Analytics Dashboard**: Real-time metrics with DynamoDB
- ✅ **Evidence Processing**: Automated refund/return handling
- ✅ **Multi-language Support**: English, Spanish, French
- ✅ **Category Tracking**: Problem categorization for insights

## 🛠️ Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure AWS Credentials**:
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials
   ```

3. **Run Locally**:
   ```bash
   npm start
   ```

4. **Access the Application**:
   - Role Selection: http://localhost:9000
   - Customer Chat: http://localhost:9000/chatbot
   - Retailer Dashboard: http://localhost:9000/dashboard

## 🏗️ AWS Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Web Interface │────│  Lambda/EC2  │────│  Amazon Bedrock │
│   (Customer)    │    │   Express    │    │  (Nova Lite)    │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │
                       ┌──────────────┐    ┌─────────────────┐
                       │  DynamoDB    │────│  Rekognition    │
                       │  (Analytics) │    │  (Images)       │
                       └──────────────┘    └─────────────────┘
```

## 🔧 AWS Deployment

1. **Automated Deployment**:
   ```bash
   ./deploy-aws.sh
   ```

2. **Manual Setup**:
   ```bash
   # Create DynamoDB table
   aws dynamodb create-table \
     --table-name retail-chatbot-analytics \
     --attribute-definitions AttributeName=pk,AttributeType=S AttributeName=sk,AttributeType=S \
     --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
     --billing-mode PAY_PER_REQUEST

   # Deploy Lambda function
   zip -r chatbot-lambda.zip .
   aws lambda create-function \
     --function-name retail-chatbot \
     --runtime nodejs18.x \
     --handler server.handler \
     --zip-file fileb://chatbot-lambda.zip
   ```

## 📊 AWS Services Configuration

### Amazon Bedrock
- **Model**: Amazon Nova Lite (`amazon.nova-lite-v1:0`)
- **Features**: Natural language processing, multilingual support
- **Fallback**: Graceful degradation to rule-based responses

### Amazon Rekognition
- **Features**: Product identification, evidence verification
- **Confidence**: 70% minimum for reliable results
- **Use Cases**: Price comparison, return processing

### Amazon DynamoDB
- **Table**: `retail-chatbot-analytics`
- **Schema**: Partition key (pk), Sort key (sk)
- **Features**: Real-time analytics, query tracking

## 🌐 Production Features

- **Auto-scaling**: Lambda handles millions of requests
- **Cost-effective**: Pay-per-use pricing model
- **High availability**: Multi-AZ deployment ready
- **Security**: IAM roles and policies
- **Monitoring**: CloudWatch integration
- **Global reach**: Multi-region deployment support

## 🔮 AWS Best Practices

1. **Security**: IAM roles with least privilege
2. **Monitoring**: CloudWatch logs and metrics
3. **Cost optimization**: Reserved capacity for predictable workloads
4. **Backup**: DynamoDB point-in-time recovery
5. **Scaling**: Auto-scaling policies for peak traffic

## 📈 Analytics & Insights

- Real-time customer sentiment analysis
- Problem category trending
- Peak usage time identification
- Multi-store performance comparison
- Text interaction patterns

## 🚀 Next Steps

1. Set up AWS credentials and permissions
2. Enable CloudWatch monitoring
4. Set up API Gateway for production
5. Implement CI/CD pipeline
6. Add more AI models via Bedrock
