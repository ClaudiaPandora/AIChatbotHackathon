async function processVoice(audioFile) {
  // Mock voice-to-text conversion
  const sampleQueries = [
    'What are your store hours?',
    'Do you have any promotions?',
    'Where is your store located?',
    'What is your return policy?',
    'What products do you sell?'
  ];
  
  return sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
}

module.exports = { processVoice };
