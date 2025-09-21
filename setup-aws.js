const { BedrockRuntimeClient, ListFoundationModelsCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

async function setupAWS() {
  console.log('🔧 Setting up AWS services for Retail Chatbot...\n');
  
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // Test Bedrock access
  console.log('1. Testing Amazon Bedrock access...');
  try {
    const bedrockClient = new BedrockRuntimeClient({ region });
    const models = await bedrockClient.send(new ListFoundationModelsCommand({}));
    
    const novaModel = models.modelSummaries?.find(m => 
      m.modelId === 'amazon.nova-lite-v1:0'
    );
    
    if (novaModel) {
      console.log('✅ Amazon Nova Lite model access confirmed');
    } else {
      console.log('❌ Amazon Nova Lite model not available. Please enable it in Bedrock console.');
    }
  } catch (error) {
    console.log('❌ Bedrock access failed:', error.message);
    console.log('   Please check your AWS credentials and Bedrock permissions.');
  }
  
  // Test DynamoDB
  console.log('\n2. Setting up DynamoDB table...');
  try {
    const dynamoClient = new DynamoDBClient({ region });
    const tableName = process.env.DYNAMODB_TABLE || 'retail-chatbot-analytics';
    
    try {
      await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
      console.log('✅ DynamoDB table exists');
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        console.log('📝 Creating DynamoDB table...');
        await dynamoClient.send(new CreateTableCommand({
          TableName: tableName,
          AttributeDefinitions: [
            { AttributeName: 'pk', AttributeType: 'S' },
            { AttributeName: 'sk', AttributeType: 'S' }
          ],
          KeySchema: [
            { AttributeName: 'pk', KeyType: 'HASH' },
            { AttributeName: 'sk', KeyType: 'RANGE' }
          ],
          BillingMode: 'PAY_PER_REQUEST'
        }));
        console.log('✅ DynamoDB table created successfully');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.log('❌ DynamoDB setup failed:', error.message);
  }
  
  console.log('\n🎉 AWS setup complete! Run "npm start" to launch the application.');
}

if (require.main === module) {
  setupAWS().catch(console.error);
}

module.exports = { setupAWS };