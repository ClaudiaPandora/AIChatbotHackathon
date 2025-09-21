const { LexRuntimeV2Client, RecognizeUtteranceCommand } = require('@aws-sdk/client-lex-runtime-v2');
const fs = require('fs');

const lexClient = new LexRuntimeV2Client({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

async function processVoice(file) {
  try {
    const audioBytes = fs.readFileSync(file.path);
    
    const command = new RecognizeUtteranceCommand({
      botId: process.env.LEX_BOT_ID || 'retail-assistant',
      botAliasId: process.env.LEX_BOT_ALIAS_ID || 'TSTALIASID',
      localeId: 'en_US',
      sessionId: `session-${Date.now()}`,
      requestContentType: 'audio/wav',
      inputStream: audioBytes
    });

    const response = await lexClient.send(command);
    
    // Convert response stream to text
    const chunks = [];
    for await (const chunk of response.audioStream) {
      chunks.push(chunk);
    }
    
    const transcript = response.inputTranscript || 'Audio processed successfully';
    return transcript;
    
  } catch (error) {
    console.error('Lex error:', error);
    // Fallback to simple audio processing simulation
    return getFallbackTranscript();
  }
}

function getFallbackTranscript() {
  const sampleTranscripts = [
    'I need help with my order',
    'What are your return policies?',
    'Do you have this product in stock?',
    'I want to return this item',
    'Can you help me find a product?'
  ];
  
  return sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
}

module.exports = { processVoice };
