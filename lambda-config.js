const mockBedrock = require('./mock-aws/bedrock');

exports.handler = async (event) => {
    const { message, language = 'en', storeId = 'store1' } = JSON.parse(event.body);
    
    try {
        const response = await mockBedrock.generateResponse(message, language, storeId);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(response)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Service unavailable' })
        };
    }
};
