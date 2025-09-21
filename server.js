const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// AWS services
const bedrock = require('./mock-aws/bedrock');
const analytics = require('./aws-services/dynamodb');

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chatbot', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chatbot.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Chatbot endpoint with AWS Bedrock
app.post('/api/chat', async (req, res) => {
  const { message, category, language = 'en', storeId = 'store1', context = [] } = req.body;
  
  if (!message || message.trim().length === 0) {
    return res.json({
      response: "I'd love to help! Could you please tell me what you need assistance with? 😊",
      sentiment: 'neutral',
      language,
      personalized: false
    });
  }
  
  try {
    const response = await bedrock.generateResponse(message, language, storeId, context);
    
    // Extract case ID from response if present
    const caseIdMatch = response.response?.match(/Case ID: (CASE-[A-Z0-9]+)/);
    const caseId = caseIdMatch ? caseIdMatch[1] : null;
    
    await analytics.trackQuery(storeId, message, response.sentiment, category, caseId);
    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.json({
      response: "I'm experiencing some technical difficulties, but I'm still here to help! 😊 Could you try asking your question again?",
      sentiment: 'neutral',
      language,
      personalized: false,
      error: true
    });
  }
});

// Image processing with AWS Rekognition + Bedrock
app.post('/api/image', upload.single('image'), async (req, res) => {
  const { storeId = 'store1', language = 'en', type, category } = req.body;
  
  try {
    let response;
    if (type === 'price-compare') {
      response = await bedrock.processPriceComparison(req.file, language);
    } else if (type === 'evidence') {
      response = await bedrock.processEvidence(req.file, category);
    } else {
      const description = await bedrock.processImage(req.file);
      response = await bedrock.generateResponse(description, language, storeId);
    }
    
    await analytics.trackQuery(storeId, `Image: ${type || 'general'}`, 'neutral', category);
    res.json({ response: response.response || response });
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({ error: 'Image processing failed' });
  }
});

// Analytics endpoints with DynamoDB
app.get('/api/analytics/:storeId', async (req, res) => {
  try {
    const data = await analytics.getStoreAnalytics(req.params.storeId);
    res.json(data);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Analytics unavailable' });
  }
});

app.post('/api/knowledge', (req, res) => {
  const { storeId, category, content } = req.body;
  bedrock.addKnowledge(storeId, category, content);
  res.json({ success: true, message: 'Knowledge updated successfully' });
});

app.get('/api/knowledge/:storeId', (req, res) => {
  const knowledge = bedrock.getKnowledgeBase(req.params.storeId);
  res.json(knowledge);
});

app.put('/api/products/:storeId/:category', (req, res) => {
  const { storeId, category } = req.params;
  const productInfo = req.body;
  bedrock.updateProductInfo(storeId, category, productInfo);
  res.json({ success: true, message: `${category} information updated` });
});

app.post('/api/case', (req, res) => {
  const { type, details, customerInfo } = req.body;
  const caseResult = bedrock.createCase(type, details, customerInfo);
  res.json(caseResult);
});

// Cases management endpoints
app.get('/api/cases', (req, res) => {
  const cases = bedrock.getAllCases();
  res.json(cases);
});

app.post('/api/cases/update', (req, res) => {
  const { caseId, status } = req.body;
  const updatedCase = bedrock.updateCaseStatus(caseId, status);
  if (updatedCase) {
    res.json({ success: true, case: updatedCase });
  } else {
    res.status(404).json({ error: 'Case not found' });
  }
});

app.get('/cases-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cases-dashboard.html'));
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`🚀 Retail Chatbot with AWS Services running on port ${PORT}`);
  console.log(`📊 Role Selection: http://localhost:${PORT}/`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`📋 Cases Dashboard: http://localhost:${PORT}/cases-dashboard`);
  console.log(`🔧 AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
});
