<<<<<<< HEAD
const CATEGORY_KEYWORDS = {
  Technical: ['server', 'bug', 'error', 'crash', 'technical', 'software', 'application', 'system'],
  Billing: ['payment', 'charged', 'refund', 'invoice', 'billing', 'charge', 'credit', 'bill'],
  Account: ['login', 'password', 'account locked', 'account', 'access', 'credentials', 'locked'],
  FeatureRequest: ['feature', 'suggestion', 'improve', 'enhancement', 'would like', 'could you add'],
  Security: ['hack', 'breach', 'unauthorized', 'security', 'compromised', 'intrusion']
};

const URGENCY_KEYWORDS = {
  Critical: ['server down', 'system crash', 'data loss', 'production down', 'security breach', 'hack', 'breach', 'unauthorized access'],
  High: ['urgent', 'asap', 'immediately', 'emergency', 'down'],
  Medium: ['payment', 'charged', 'refund', 'invoice', 'billing', 'account locked'],
  Low: ['feature', 'suggestion', 'improve', 'when you get a chance', 'enhancement']
};

const URGENCY_ORDER = { Critical: 4, High: 3, Medium: 2, Low: 1 };

export function classifyTicket(description) {
  const text = (description || '').toLowerCase();
  let category = 'Technical';
  let score = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matchCount = keywords.filter(kw => text.includes(kw)).length;
    if (matchCount > score) {
      score = matchCount;
      category = cat === 'FeatureRequest' ? 'Feature Request' : cat;
    }
  }

  // Urgency: highest-priority match wins (Critical > High > Medium > Low)
  let urgency = 'Medium';
  let urgencyPriority = 0;

  for (const [level, keywords] of Object.entries(URGENCY_KEYWORDS)) {
    const matched = keywords.some(kw => text.includes(kw));
    const priority = URGENCY_ORDER[level] || 0;
    if (matched && priority > urgencyPriority) {
      urgencyPriority = priority;
      urgency = level;
    }
  }

  return { category, urgency };
=======
import { TICKET_TAXONOMY } from './ticketTaxonomy.js';

const URGENCY_ORDER = { Critical: 4, High: 3, Medium: 2, Low: 1 };

const DEFAULT_CLASSIFICATION = {
  category: 'IT Department',
  subcategory: 'Application Issues',
  urgency: 'Medium'
};

export function classifyTicket(description) {
  const text = (description || '').toLowerCase();
  let best = DEFAULT_CLASSIFICATION;
  let bestScore = 0;

  for (const dept of TICKET_TAXONOMY) {
    for (const sub of dept.subcategories) {
      const matches = sub.keywords.filter(kw => text.includes(kw.toLowerCase())).length;
      if (!matches) continue;
      const urgencyWeight = URGENCY_ORDER[sub.urgency] || 0;
      const score = matches * 10 + urgencyWeight;
      if (score > bestScore) {
        bestScore = score;
        best = { category: dept.category, subcategory: sub.name, urgency: sub.urgency };
      }
    }
  }

  return best;
>>>>>>> fb8869bc (Second Commit)
}
