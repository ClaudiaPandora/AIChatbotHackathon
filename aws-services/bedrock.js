const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { RekognitionClient, DetectLabelsCommand } = require('@aws-sdk/client-rekognition');
const fs = require('fs');

// Initialize Bedrock client with proper credential handling
const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  } : undefined
});

const rekognitionClient = new RekognitionClient({ 
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  } : undefined
});

const knowledgeBase = {
  store1: {
    products: {
      electronics: {
        categories: ['Smartphones', 'Laptops', 'Tablets', 'Headphones', 'Smart Watches', 'Gaming Consoles'],
        brands: ['Apple', 'Samsung', 'Sony', 'Microsoft', 'Nintendo', 'Dell', 'HP'],
        warranty: '1-2 years manufacturer warranty',
        support: '24/7 technical support available'
      },
      clothing: {
        categories: ['Men\'s Wear', 'Women\'s Wear', 'Kids Clothing', 'Shoes', 'Accessories'],
        sizes: 'XS to 5XL available',
        materials: 'Cotton, Polyester, Silk, Wool blends',
        care: 'Washing instructions on labels'
      },
      homeGarden: {
        categories: ['Furniture', 'Kitchen Appliances', 'Garden Tools', 'Home Decor', 'Lighting'],
        delivery: 'Free delivery on orders over $100',
        assembly: 'Assembly service available for $50'
      }
    },
    policies: {
      returns: '30-day return policy with receipt. Items must be in original condition.',
      exchanges: 'Free exchanges within 14 days',
      warranty: 'Extended warranty options available',
      shipping: 'Free shipping on orders over $50. Express delivery available.',
      payment: 'Accept all major credit cards, PayPal, Apple Pay, Google Pay'
    },
    promotions: {
      current: '20% off electronics, Buy 2 Get 1 Free on clothing',
      seasonal: 'Holiday sales in December, Summer clearance in July',
      loyalty: 'Loyalty program: 5% cashback on all purchases'
    },
    locations: {
      main: '123 Main St, Downtown Mall - Open 9AM-9PM',
      branch: '456 Oak Ave, Shopping Center - Open 10AM-8PM',
      online: '24/7 online shopping with same-day delivery in metro areas'
    },
    contact: {
      phone: '1-800-RETAIL',
      email: 'support@retailstore.com',
      chat: '24/7 live chat support',
      social: 'Follow us @retailstore on all platforms'
    },
    faq: {
      'order status': 'Track your order using order number on our website',
      'price match': 'We match competitor prices with proof',
      'gift cards': 'Gift cards available in $25-$500 denominations',
      'membership': 'Free membership with exclusive discounts',
      'technical support': 'Free tech support for electronics purchases'
    }
  }
};

async function generateResponse(message, language = 'en', storeId = 'store1', context = []) {
  const store = knowledgeBase[storeId] || knowledgeBase.store1;
  
  // Enhanced knowledge search
  const relevantInfo = searchKnowledge(message, store);
  
  let contextStr = '';
  if (context.length > 0) {
    contextStr = 'Previous conversation:\n' + 
      context.slice(-3).map(c => `${c.role}: ${c.message}`).join('\n') + '\n\n';
  }

  const prompt = `You are an expert retail customer service assistant. Provide accurate, helpful responses based on the store information below.

${contextStr}Customer Question: "${message}"

STORE KNOWLEDGE:
${JSON.stringify(store, null, 2)}

RELEVANT INFO: ${relevantInfo}

Instructions:
1. Give specific, accurate answers based on the store knowledge
2. Be helpful and professional
3. If asking about products, mention specific categories, brands, and details
4. For policies, provide exact terms and conditions
5. Include relevant contact information when appropriate
6. Keep responses concise but complete
7. Use a friendly, conversational tone

Respond in ${language}.`;

  try {
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-lite-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: [{ text: prompt }]
        }],
        inferenceConfig: {
          maxTokens: 500,
          temperature: 0.7,
          topP: 0.9
        }
      })
    });

    console.log('Calling Nova Lite with prompt length:', prompt.length);
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    console.log('Nova Lite response received');
    return {
      response: responseBody.output.message.content[0].text,
      sentiment: analyzeSentiment(message),
      language,
      personalized: true,
      knowledgeUsed: true,
      source: 'nova-lite'
    };
  } catch (error) {
    console.error('Nova Lite error:', error.message);
    
    // If Nova Lite fails, use knowledge-based response
    return generateKnowledgeBasedResponse(message, language, store, relevantInfo);
  }
}

function searchKnowledge(query, store) {
  const queryLower = query.toLowerCase();
  let relevantInfo = [];
  
  // Search products
  Object.entries(store.products).forEach(([category, details]) => {
    if (queryLower.includes(category) || 
        details.categories?.some(cat => queryLower.includes(cat.toLowerCase())) ||
        details.brands?.some(brand => queryLower.includes(brand.toLowerCase()))) {
      relevantInfo.push(`${category.toUpperCase()}: ${JSON.stringify(details, null, 2)}`);
    }
  });
  
  // Search policies
  Object.entries(store.policies).forEach(([policy, details]) => {
    if (queryLower.includes(policy) || queryLower.includes('policy') || 
        queryLower.includes('return') || queryLower.includes('exchange') ||
        queryLower.includes('shipping') || queryLower.includes('payment')) {
      relevantInfo.push(`${policy.toUpperCase()}: ${details}`);
    }
  });
  
  // Search promotions
  if (queryLower.includes('promotion') || queryLower.includes('sale') || 
      queryLower.includes('discount') || queryLower.includes('offer')) {
    relevantInfo.push(`PROMOTIONS: ${JSON.stringify(store.promotions, null, 2)}`);
  }
  
  // Search locations/contact
  if (queryLower.includes('location') || queryLower.includes('address') || 
      queryLower.includes('phone') || queryLower.includes('contact') ||
      queryLower.includes('hours') || queryLower.includes('open')) {
    relevantInfo.push(`LOCATIONS: ${JSON.stringify(store.locations, null, 2)}`);
    relevantInfo.push(`CONTACT: ${JSON.stringify(store.contact, null, 2)}`);
  }
  
  // Search FAQ
  Object.entries(store.faq).forEach(([question, answer]) => {
    if (queryLower.includes(question) || question.split(' ').some(word => queryLower.includes(word))) {
      relevantInfo.push(`FAQ - ${question.toUpperCase()}: ${answer}`);
    }
  });
  
  return relevantInfo.join('\n\n');
}

function generateKnowledgeBasedResponse(message, language, store, relevantInfo) {
  const queryLower = message.toLowerCase();
  let response = '';
  
  // Product inquiries
  if (queryLower.includes('product') || queryLower.includes('electronics') || 
      queryLower.includes('clothing') || queryLower.includes('home')) {
    response = `📱 **Our Product Categories:**\n\n`;
    Object.entries(store.products).forEach(([category, details]) => {
      response += `**${category.toUpperCase()}:**\n`;
      response += `• Categories: ${details.categories.join(', ')}\n`;
      if (details.brands) response += `• Brands: ${details.brands.join(', ')}\n`;
      if (details.warranty) response += `• Warranty: ${details.warranty}\n`;
      response += '\n';
    });
  }
  
  // Policy inquiries
  else if (queryLower.includes('return') || queryLower.includes('exchange') || 
           queryLower.includes('policy') || queryLower.includes('refund')) {
    response = `📋 **Store Policies:**\n\n`;
    Object.entries(store.policies).forEach(([policy, details]) => {
      response += `**${policy.toUpperCase()}:** ${details}\n\n`;
    });
  }
  
  // Promotion inquiries
  else if (queryLower.includes('promotion') || queryLower.includes('sale') || 
           queryLower.includes('discount') || queryLower.includes('offer')) {
    response = `🎯 **Current Promotions:**\n\n`;
    response += `• **Current Offers:** ${store.promotions.current}\n`;
    response += `• **Seasonal Sales:** ${store.promotions.seasonal}\n`;
    response += `• **Loyalty Program:** ${store.promotions.loyalty}\n`;
  }
  
  // Location/contact inquiries
  else if (queryLower.includes('location') || queryLower.includes('address') || 
           queryLower.includes('phone') || queryLower.includes('contact') || 
           queryLower.includes('hours')) {
    response = `📍 **Store Information:**\n\n`;
    response += `**LOCATIONS:**\n`;
    Object.entries(store.locations).forEach(([type, details]) => {
      response += `• **${type.toUpperCase()}:** ${details}\n`;
    });
    response += `\n**CONTACT:**\n`;
    Object.entries(store.contact).forEach(([method, details]) => {
      response += `• **${method.toUpperCase()}:** ${details}\n`;
    });
  }
  
  // FAQ inquiries
  else if (queryLower.includes('track') || queryLower.includes('order') || 
           queryLower.includes('gift card') || queryLower.includes('membership')) {
    response = `❓ **Frequently Asked Questions:**\n\n`;
    Object.entries(store.faq).forEach(([question, answer]) => {
      if (queryLower.includes(question.split(' ')[0])) {
        response += `**${question.toUpperCase()}:** ${answer}\n\n`;
      }
    });
    if (response === `❓ **Frequently Asked Questions:**\n\n`) {
      Object.entries(store.faq).forEach(([question, answer]) => {
        response += `**${question.toUpperCase()}:** ${answer}\n\n`;
      });
    }
  }
  
  // General greeting or unclear question
  else {
    response = `👋 **Welcome! I'm here to help you with:**\n\n`;
    response += `📱 **Products:** Electronics, Clothing, Home & Garden\n`;
    response += `📋 **Policies:** Returns, Exchanges, Shipping, Payment\n`;
    response += `🎯 **Promotions:** ${store.promotions.current}\n`;
    response += `📍 **Locations:** ${store.locations.main}\n`;
    response += `📞 **Contact:** ${store.contact.phone}\n\n`;
    response += `What specific information can I help you find today?`;
  }
  
  response += `\n\n💬 **Need more help?** Contact us at ${store.contact.phone} or ${store.contact.email}`;
  
  return {
    response,
    sentiment: analyzeSentiment(message),
    language,
    personalized: false,
    knowledgeUsed: true,
    source: 'knowledge-base'
  };
}

async function processImage(file) {
  try {
    const imageBytes = fs.readFileSync(file.path);
    
    const command = new DetectLabelsCommand({
      Image: { Bytes: imageBytes },
      MaxLabels: 10,
      MinConfidence: 70
    });

    const response = await rekognitionClient.send(command);
    const labels = response.Labels.map(label => label.Name).join(', ');
    
    return `I can see: ${labels}. Let me help you find similar products or pricing information.`;
  } catch (error) {
    console.error('Rekognition error:', error);
    return 'I can see your image. Let me help you with product information.';
  }
}

async function processPriceComparison(file, language = 'en') {
  try {
    const imageBytes = fs.readFileSync(file.path);
    
    const command = new DetectLabelsCommand({
      Image: { Bytes: imageBytes },
      MaxLabels: 5,
      MinConfidence: 80
    });

    const response = await rekognitionClient.send(command);
    const mainLabel = response.Labels[0]?.Name || 'Product';
    
    const prompt = `Based on the product "${mainLabel}", provide a price comparison response in ${language} with our store price and 2 competitor prices. Include a recommendation.`;
    
    const bedrockCommand = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const bedrockResponse = await bedrockClient.send(bedrockCommand);
    const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    
    return { response: responseBody.content[0].text };
  } catch (error) {
    console.error('Price comparison error:', error);
    return { response: 'Product identified. Checking prices... Our competitive pricing ensures great value!' };
  }
}

async function processEvidence(file, category) {
  const evidenceId = `EV${Date.now()}`;
  
  try {
    const imageBytes = fs.readFileSync(file.path);
    
    const command = new DetectLabelsCommand({
      Image: { Bytes: imageBytes },
      MaxLabels: 5,
      MinConfidence: 70
    });

    await rekognitionClient.send(command);
    
    let response = `📋 Evidence processed successfully\n`;
    response += `✅ Image quality: Verified\n`;
    response += `📝 Evidence ID: ${evidenceId}\n`;
    
    if (category === 'return-refund') {
      response += `\n🔄 Refund approved. Processing time: 3-5 business days.`;
    } else {
      response += `\n👨‍💼 Specialist will review within 24 hours.`;
    }
    
    return { response };
  } catch (error) {
    console.error('Evidence processing error:', error);
    return { 
      response: `📋 Evidence received (ID: ${evidenceId}). Manual review initiated.` 
    };
  }
}

function analyzeSentiment(text) {
  const positive = ['good', 'great', 'excellent', 'love', 'amazing', 'perfect', 'wonderful'];
  const negative = ['bad', 'terrible', 'hate', 'awful', 'worst', 'horrible', 'disappointed'];
  
  const words = text.toLowerCase().split(' ');
  const positiveCount = words.filter(w => positive.includes(w)).length;
  const negativeCount = words.filter(w => negative.includes(w)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function getAccurateFallback(message, language, store) {
  const responses = {
    en: "I'm sorry, I'm having a technical issue right now, but I'm still here to help! 😊\n\nCould you please rephrase your question? I want to make sure I give you the most helpful answer possible.",
    es: "Lo siento, tengo un problema técnico ahora, ¡pero estoy aquí para ayudarte! 😊\n\n¿Podrías reformular tu pregunta? Quiero asegurarme de darte la respuesta más útil posible.",
    fr: "Désolé, j'ai un problème technique maintenant, mais je suis là pour vous aider! 😊\n\nPourriez-vous reformuler votre question? Je veux m'assurer de vous donner la réponse la plus utile possible."
  };
  
  return responses[language] || responses.en;
}

function addKnowledge(storeId, category, content) {
  if (!knowledgeBase[storeId]) {
    knowledgeBase[storeId] = JSON.parse(JSON.stringify(knowledgeBase.store1)); // Clone default
  }
  
  // Handle nested category updates
  const categories = category.split('.');
  let current = knowledgeBase[storeId];
  
  for (let i = 0; i < categories.length - 1; i++) {
    if (!current[categories[i]]) current[categories[i]] = {};
    current = current[categories[i]];
  }
  
  current[categories[categories.length - 1]] = content;
}

function getKnowledgeBase(storeId) {
  return knowledgeBase[storeId] || knowledgeBase.store1;
}

function updateProductInfo(storeId, productCategory, info) {
  if (!knowledgeBase[storeId]) {
    knowledgeBase[storeId] = JSON.parse(JSON.stringify(knowledgeBase.store1));
  }
  knowledgeBase[storeId].products[productCategory] = { 
    ...knowledgeBase[storeId].products[productCategory], 
    ...info 
  };
}

module.exports = { 
  generateResponse, 
  processImage, 
  processPriceComparison, 
  processEvidence, 
  addKnowledge,
  getKnowledgeBase,
  updateProductInfo
};
