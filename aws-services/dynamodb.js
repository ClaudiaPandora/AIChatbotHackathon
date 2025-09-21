const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'retail-chatbot-analytics';

async function trackQuery(storeId, query, sentiment, category) {
  const timestamp = new Date().toISOString();
  const hour = new Date().getHours();
  
  try {
    // Store individual query
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `STORE#${storeId}`,
        sk: `QUERY#${timestamp}`,
        query,
        sentiment,
        category,
        hour,
        timestamp
      }
    }));

    // Update aggregated stats
    await updateAggregatedStats(storeId, query, sentiment, category, hour);
    
  } catch (error) {
    console.error('DynamoDB tracking error:', error);
    // Fall back to in-memory storage
    fallbackTrackQuery(storeId, query, sentiment, category);
  }
}

async function updateAggregatedStats(storeId, query, sentiment, category, hour) {
  const statsKey = `STATS#${storeId}`;
  
  try {
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk: statsKey, sk: 'AGGREGATE' },
      UpdateExpression: `
        ADD totalQueries :inc, 
            sentiment.#sentiment :inc,
            peakHours.#hour :inc,
            categories.#category :inc,
            faqs.#faq :inc
      `,
      ExpressionAttributeNames: {
        '#sentiment': sentiment,
        '#hour': hour.toString(),
        '#category': category || 'uncategorized',
        '#faq': query.substring(0, 20).toLowerCase()
      },
      ExpressionAttributeValues: {
        ':inc': 1
      }
    }));
  } catch (error) {
    console.error('Stats update error:', error);
  }
}

async function getStoreAnalytics(storeId) {
  try {
    const response = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: `STATS#${storeId}`, sk: 'AGGREGATE' }
    }));

    if (!response.Item) {
      return getEmptyAnalytics();
    }

    const data = response.Item;
    
    // Process top FAQs
    const topFaqs = Object.entries(data.faqs || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    // Process top categories
    const topCategories = Object.entries(data.categories || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    // Get peak hour
    const peakHour = Object.entries(data.peakHours || {})
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalQueries: data.totalQueries || 0,
      topFaqs,
      sentiment: data.sentiment || { positive: 0, negative: 0, neutral: 0 },
      peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A',
      topCategories
    };
    
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    return getFallbackAnalytics(storeId);
  }
}

// Fallback in-memory storage with cleanup
const fallbackStorage = {};
const MAX_STORES = 100;
const MAX_FAQ_KEYS = 50;

// Cleanup old entries to prevent memory leaks
function cleanupFallbackStorage() {
  const storeIds = Object.keys(fallbackStorage);
  if (storeIds.length > MAX_STORES) {
    // Remove oldest stores
    storeIds.slice(0, storeIds.length - MAX_STORES).forEach(id => {
      delete fallbackStorage[id];
    });
  }
  
  // Limit FAQ keys per store
  storeIds.forEach(storeId => {
    const store = fallbackStorage[storeId];
    if (store && store.faqs) {
      const faqEntries = Object.entries(store.faqs);
      if (faqEntries.length > MAX_FAQ_KEYS) {
        // Keep only top FAQs by count
        const topFaqs = faqEntries
          .sort(([,a], [,b]) => b - a)
          .slice(0, MAX_FAQ_KEYS);
        store.faqs = Object.fromEntries(topFaqs);
      }
    }
  });
}

function fallbackTrackQuery(storeId, query, sentiment, category) {
  if (!fallbackStorage[storeId]) {
    fallbackStorage[storeId] = {
      totalQueries: 0,
      faqs: {},
      sentiment: { positive: 0, negative: 0, neutral: 0 },
      peakHours: {},
      categories: {}
    };
  }
  
  const store = fallbackStorage[storeId];
  store.totalQueries++;
  
  const faqKey = query.toLowerCase().substring(0, 20);
  store.faqs[faqKey] = (store.faqs[faqKey] || 0) + 1;
  store.sentiment[sentiment]++;
  
  const hour = new Date().getHours();
  store.peakHours[hour] = (store.peakHours[hour] || 0) + 1;
  
  if (category) {
    store.categories[category] = (store.categories[category] || 0) + 1;
  }
  
  // Periodic cleanup to prevent memory leaks
  if (Math.random() < 0.01) { // 1% chance per call
    cleanupFallbackStorage();
  }
}

function getFallbackAnalytics(storeId) {
  const store = fallbackStorage[storeId] || getEmptyAnalytics();
  
  const topFaqs = Object.entries(store.faqs || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  const topCategories = Object.entries(store.categories || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  const peakHour = Object.entries(store.peakHours || {})
    .sort(([,a], [,b]) => b - a)[0];
  
  return {
    totalQueries: store.totalQueries || 0,
    topFaqs,
    sentiment: store.sentiment || { positive: 0, negative: 0, neutral: 0 },
    peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A',
    topCategories
  };
}

function getEmptyAnalytics() {
  return {
    totalQueries: 0,
    topFaqs: [],
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    peakHour: 'N/A',
    topCategories: []
  };
}

module.exports = { trackQuery, getStoreAnalytics };
