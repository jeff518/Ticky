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
}
