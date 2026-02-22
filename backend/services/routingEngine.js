const TEAM_MAPPING = {
<<<<<<< HEAD
  Technical: 'IT Support Team',
  Billing: 'Finance Team',
=======
  'IT Department': 'IT Support Team',
  'Finance Department': 'Finance Team',
  'Security Department': 'Security Team',
  'Customer Service': 'Customer Support',
  'Billing Department': 'Billing Team',
  // Backward compatibility for old category values
  Technical: 'IT Support Team',
  Billing: 'Billing Team',
>>>>>>> fb8869bc (Second Commit)
  Account: 'Customer Support',
  Security: 'Security Team',
  'Feature Request': 'Product Team'
};

export function routeTicket(category) {
  return TEAM_MAPPING[category] || 'Customer Support';
}
