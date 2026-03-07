const TEAM_MAPPING = {
<<<<<<< HEAD
=======
<<<<<<< HEAD
  Technical: 'IT Support Team',
  Billing: 'Finance Team',
=======
>>>>>>> 30dfe3f28086f4750f83352912032e5956f2437b
  'IT Department': 'IT Support Team',
  'Finance Department': 'Finance Team',
  'Security Department': 'Security Team',
  'Customer Service': 'Customer Support',
  'Billing Department': 'Billing Team',
  // Backward compatibility for old category values
  Technical: 'IT Support Team',
  Billing: 'Billing Team',
<<<<<<< HEAD
=======
>>>>>>> fb8869bc (Second Commit)
>>>>>>> 30dfe3f28086f4750f83352912032e5956f2437b
  Account: 'Customer Support',
  Security: 'Security Team',
  'Feature Request': 'Product Team'
};

export function routeTicket(category) {
  return TEAM_MAPPING[category] || 'Customer Support';
}
