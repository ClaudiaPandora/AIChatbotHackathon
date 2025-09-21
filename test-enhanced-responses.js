const { generateResponse } = require('./mock-aws/bedrock');

async function testChatbotResponses() {
    console.log('Testing Enhanced Chatbot Responses\n');
    
    const testCases = [
        {
            name: 'Personal Info Change',
            message: 'I want to change my address and phone number'
        },
        {
            name: 'Promotion Inquiry',
            message: 'What promotions do you have?'
        },
        {
            name: 'Promotion Redemption Issue',
            message: 'I cannot redeem the promotion offer'
        },
        {
            name: 'Technical Issue',
            message: 'The payment system is not working'
        },
        {
            name: 'Warranty Question',
            message: 'What is the warranty on this product?'
        },
        {
            name: 'Unhandled Question',
            message: 'Do you have any special services for corporate clients?'
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`--- ${testCase.name} ---`);
        console.log(`Input: "${testCase.message}"`);
        
        try {
            const result = await generateResponse(testCase.message);
            console.log(`Response: ${result.response}`);
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
        
        console.log('');
    }
}

testChatbotResponses();