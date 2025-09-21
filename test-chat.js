const bedrock = require('./aws-services/bedrock');

async function testChat() {
  console.log('Testing chatbot response...');
  
  try {
    const response = await bedrock.generateResponse('Hello, I need help with a product', 'en', 'store1', []);
    console.log('✅ Chat test successful!');
    console.log('Response:', response);
  } catch (error) {
    console.error('❌ Chat test failed:', error);
  }
}

testChat();