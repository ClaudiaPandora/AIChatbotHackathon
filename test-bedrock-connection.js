const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

async function testBedrockConnection() {
  const client = new BedrockRuntimeClient({ 
    region: process.env.AWS_REGION || 'us-east-1' 
  });

  try {
    console.log('Testing Bedrock connection...');
    
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-lite-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: [{ text: 'Hello, can you help me?' }]
        }],
        inferenceConfig: {
          max_new_tokens: 100,
          temperature: 0.3
        }
      })
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    console.log('✅ Bedrock connection successful!');
    console.log('Response:', responseBody.output.message.content[0].text);
    return true;
  } catch (error) {
    console.log('❌ Bedrock connection failed:', error.message);
    console.log('The chatbot will use knowledge-based responses instead.');
    return false;
  }
}

if (require.main === module) {
  testBedrockConnection();
}

module.exports = { testBedrockConnection };
