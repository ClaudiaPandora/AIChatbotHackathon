const knowledgeBase = {
  store1: {
    products: ['Electronics', 'Clothing', 'Home & Garden'],
    returns: '30-day return policy with receipt',
    promotions: '20% off electronics this week (minimum $100 purchase, membership required)',
    locations: '123 Main St, Downtown Mall',
    membershipRequired: true,
    minimumSpend: 100
  }
};

// Case management system
const cases = [];

function createCase(type, description, customerInfo = {}) {
  const caseId = 'CASE-' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
  const newCase = {
    id: caseId,
    type: type,
    description: description,
    status: 'awaiting',
    createdAt: new Date().toISOString(),
    customerInfo: customerInfo,
    updatedAt: new Date().toISOString()
  };
  cases.push(newCase);
  return newCase;
}

function getAllCases() {
  return cases;
}

function updateCaseStatus(caseId, status) {
  const caseIndex = cases.findIndex(c => c.id === caseId);
  if (caseIndex !== -1) {
    cases[caseIndex].status = status;
    cases[caseIndex].updatedAt = new Date().toISOString();
    return cases[caseIndex];
  }
  return null;
}

const translations = {
  en: { greeting: 'Hello! How can I help you today?', offer: 'Special offer for you!' },
  es: { greeting: '¡Hola! ¿Cómo puedo ayudarte hoy?', offer: '¡Oferta especial para ti!' },
  fr: { greeting: 'Bonjour! Comment puis-je vous aider aujourd\'hui?', offer: 'Offre spéciale pour vous!' }
};

function analyzeSentiment(text) {
  const positive = ['good', 'great', 'excellent', 'love', 'amazing'];
  const negative = ['bad', 'terrible', 'hate', 'awful', 'worst'];
  
  const words = text.toLowerCase().split(' ');
  const positiveCount = words.filter(w => positive.includes(w)).length;
  const negativeCount = words.filter(w => negative.includes(w)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}



async function generateResponse(message, language = 'en', storeId = 'store1') {
  const store = knowledgeBase[storeId] || knowledgeBase.store1;
  const lang = translations[language] || translations.en;
  
  let response = lang.greeting;
  const sentiment = analyzeSentiment(message);
  const msgLower = message.toLowerCase();
  
  // Personal info changes (address, phone, email, etc.)
  if (msgLower.includes('change') && (msgLower.includes('address') || msgLower.includes('phone') || msgLower.includes('email') || msgLower.includes('personal') || msgLower.includes('contact') || msgLower.includes('update'))) {
    const newCase = createCase('Personal Info Update', message);
    response = `I'd be happy to help you update your personal information. Please provide the following details:\n\n• Current information you want to change\n• New information you want to update to\n• Your account verification details\n\nWe have created a case for your request.\nCase ID: ${newCase.id}\nStatus: ${newCase.status}\n\nPlease keep this Case ID for any follow-up inquiries and to check your case status. Our team will process your request within 1-2 business days.`;
  }
  // Promotion inquiries
  else if (msgLower.includes('promotion') || msgLower.includes('discount') || msgLower.includes('offer') || msgLower.includes('deal')) {
    if (msgLower.includes('redeem') || msgLower.includes('use') || msgLower.includes('apply')) {
      response = `Current promotion: ${store.promotions}\n\nIf you're unable to redeem this offer, it may be because:\n• You're not a registered member (membership required)\n• Minimum spending requirement not met\n• Promotion terms and conditions not fulfilled\n\nPlease read the full promotion requirements or contact us for assistance with membership registration.`;
    } else {
      response = `Current promotion: ${store.promotions}\n\nDon't miss out on this great deal! Terms and conditions apply.`;
    }
  }
  // Technical and payment issues
  else if (msgLower.includes('technical') || msgLower.includes('payment') || msgLower.includes('error') || msgLower.includes('bug') || msgLower.includes('not working') || msgLower.includes('problem') || msgLower.includes('issue')) {
    response = `We sincerely apologize for your experience. We have recorded this feedback to help us improve, and we appreciate your kind understanding.\n\nOur technical team is working to resolve these issues. If you continue experiencing problems, please contact our support team directly.`;
  }
  // Warranty inquiries
  else if (msgLower.includes('warranty') || msgLower.includes('guarantee')) {
    response = `Warranty coverage varies by product type and manufacturer. To provide you with accurate warranty information, could you please share:\n\n• Product name/model\n• Purchase date\n• Specific warranty concern\n\nThis will help us give you the most relevant warranty details for your item.`;
  }
  // Return/Refund requests
  else if (msgLower.includes('return') || msgLower.includes('refund')) {
    const newCase = createCase('Return/Refund Request', message);
    response = `${store.returns}\n\nTo process your return/refund request, please upload a photo of the product as evidence.\n\nWe have created a case for retailer review.\nCase ID: ${newCase.id}\nStatus: ${newCase.status}\n\nYour request will be processed within 2-3 business days. Please keep this Case ID for reference.`;
  }
  // Product inquiries
  else if (msgLower.includes('product')) {
    response = `We have: ${store.products.join(', ')}. You can upload a photo for price comparison! ${lang.offer}`;
  }
  // Location inquiries
  else if (msgLower.includes('location') || msgLower.includes('store') || msgLower.includes('address')) {
    response = `Visit us at: ${store.locations}`;
  }
  // Fallback for unhandled questions - ALWAYS create case
  else {
    const newCase = createCase('General Inquiry', message);
    response = `Thank you for your inquiry. We want to make sure we provide you with the most accurate information.\n\nWe have created a case for retailer review.\nCase ID: ${newCase.id}\nStatus: ${newCase.status}\n\nWe will review your question and get back to you within 1-3 days. Please wait a moment and please be patient.\n\nPlease keep this Case ID for your reference and follow-up.`;
  }
  
  return { response, sentiment, language, personalized: true };
}

async function processImage(file) {
  const products = [
    { name: 'shirt', price: '$29.99' },
    { name: 'shoes', price: '$79.99' },
    { name: 'phone', price: '$699.99' },
    { name: 'laptop', price: '$1299.99' },
    { name: 'watch', price: '$199.99' }
  ];
  
  const randomProduct = products[Math.floor(Math.random() * products.length)];
  const isInStore = Math.random() > 0.3;
  
  if (isInStore) {
    return `I see a ${randomProduct.name} in the image. This item's price is ${randomProduct.price}`;
  } else {
    return `I see a ${randomProduct.name} in the image. This item is not available in this store`;
  }
}

async function processPriceComparison(file, language = 'en') {
  const products = [
    { name: 'iPhone 15', ourPrice: '$799', competitors: [{ store: 'Amazon', price: '$829' }, { store: 'Best Buy', price: '$799' }] },
    { name: 'Nike Air Max', ourPrice: '$120', competitors: [{ store: 'Foot Locker', price: '$130' }, { store: 'Amazon', price: '$125' }] },
    { name: 'Samsung TV 55"', ourPrice: '$649', competitors: [{ store: 'Walmart', price: '$679' }, { store: 'Target', price: '$659' }] }
  ];
  
  const product = products[Math.floor(Math.random() * products.length)];
  
  let response = `📱 Product identified: ${product.name}\n`;
  response += `💰 Our price: ${product.ourPrice}\n`;
  response += `🏪 Competitor prices:\n`;
  product.competitors.forEach(comp => {
    response += `• ${comp.store}: ${comp.price}\n`;
  });
  
  const savings = Math.random() > 0.5;
  if (savings) {
    response += `\n✅ Great news! You're getting the best deal with us!`;
  } else {
    response += `\n💡 We can offer you a 5% price match discount!`;
  }
  
  return { response };
}

async function processEvidence(file, category) {
  const evidenceTypes = {
    'return-refund': 'Return/Refund Evidence',
    'shipping': 'Shipping Issue Evidence',
    'product-inquiry': 'Product Issue Evidence',
    'payment': 'Payment Issue Evidence',
    'technical': 'Technical Issue Evidence'
  };
  
  const type = evidenceTypes[category] || 'General Evidence';
  
  let response = `📋 ${type} received and processed.\n`;
  response += `✅ Image quality: Good\n`;
  response += `📝 Evidence ID: EV${Date.now()}\n`;
  
  if (category === 'return-refund') {
    response += `\n🔄 Your refund request has been approved based on the evidence provided. Processing time: 3-5 business days.`;
  } else {
    response += `\n👨‍💼 A specialist will review your case within 24 hours and contact you with a resolution.`;
  }
  
  return { response };
}

function addKnowledge(storeId, category, content) {
  if (!knowledgeBase[storeId]) knowledgeBase[storeId] = {};
  knowledgeBase[storeId][category] = content;
}

module.exports = { generateResponse, processImage, processPriceComparison, processEvidence, addKnowledge, getAllCases, updateCaseStatus, createCase };
