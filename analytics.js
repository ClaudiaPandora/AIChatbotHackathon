const storeAnalytics = {};

function trackQuery(storeId, query, sentiment, category, caseId = null) {
  if (!storeAnalytics[storeId]) {
    storeAnalytics[storeId] = {
      totalQueries: 0,
      faqs: {},
      sentiment: { positive: 0, negative: 0, neutral: 0 },
      peakHours: {},
      languages: {},
      categories: {},
      cases: []
    };
  }
  
  const store = storeAnalytics[storeId];
  store.totalQueries++;
  
  // Track case if provided
  if (caseId) {
    store.cases.push({
      caseId,
      query: query.substring(0, 50),
      timestamp: new Date().toISOString(),
      category: category || 'General'
    });
  }
  
  // Track FAQs
  const faqKey = query.toLowerCase().substring(0, 20);
  store.faqs[faqKey] = (store.faqs[faqKey] || 0) + 1;
  
  // Track sentiment
  store.sentiment[sentiment]++;
  
  // Track peak hours
  const hour = new Date().getHours();
  store.peakHours[hour] = (store.peakHours[hour] || 0) + 1;
  
  // Track categories
  if (category) {
    store.categories[category] = (store.categories[category] || 0) + 1;
  }
}

function getStoreAnalytics(storeId) {
  const store = storeAnalytics[storeId] || {
    totalQueries: 0,
    faqs: {},
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    peakHours: {},
    languages: {},
    categories: {},
    cases: []
  };
  
  // Get top FAQs
  const topFaqs = Object.entries(store.faqs)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  // Get peak hour
  const peakHour = Object.entries(store.peakHours)
    .sort(([,a], [,b]) => b - a)[0];
  
  // Get top problem categories
  const topCategories = Object.entries(store.categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  return {
    totalQueries: store.totalQueries,
    topFaqs,
    sentiment: store.sentiment,
    peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A',
    topCategories,
    recentCases: store.cases.slice(-10).reverse()
  };
}

module.exports = { trackQuery, getStoreAnalytics };
