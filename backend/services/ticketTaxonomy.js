export const TICKET_TAXONOMY = [
  {
    category: 'IT Department',
    subcategories: [
      {
        name: 'Application Issues',
        urgency: 'Medium',
        keywords: [
          'login failed', 'cannot login', 'authentication error', 'invalid credentials', 'session expired',
          'token expired', 'otp not received', 'access denied', '401 error', '403 error', '500 error',
          '404 error', 'internal server error', 'app crashed', 'unexpected error', 'runtime error',
          'null pointer exception', 'stack trace', 'api failure', 'integration issue', 'feature not working',
          'button not clickable', 'form not submitting', 'page not loading', 'blank screen', 'ui broken',
          'layout issue', 'css issue', 'mobile view issue', 'dropdown not loading', 'validation error'
        ]
      },
      {
        name: 'Server Issues',
        urgency: 'Critical',
        keywords: [
          'server down', 'production down', 'staging down', 'host unreachable', 'service unavailable', '503 error',
          'server not responding', 'system outage', 'environment down', 'high cpu', 'high memory', 'disk full',
          'out of memory', 'oom error', 'storage full', 'server overload', 'deployment failed', 'build failed',
          'container crash', 'docker error', 'pod crash', 'restart loop', 'load balancer issue', 'ssl expired',
          'certificate error', 'nginx error', 'apache error'
        ]
      },
      {
        name: 'Network Problems',
        urgency: 'High',
        keywords: [
          'network unreachable', 'internet not working', 'connection timeout', 'dns failure', 'latency issue',
          'packet loss', 'ping failed', 'vpn not connecting', 'firewall issue', 'proxy issue', 'ip blocked',
          'routing issue', 'port blocked', 'gateway timeout', 'connection refused', 'tls error',
          'third-party api down', 'webhook failed'
        ]
      },
      {
        name: 'Software Installation',
        urgency: 'Medium',
        keywords: [
          'installation failed', 'setup failed', 'dependency error', 'missing package', 'incompatible version',
          'version conflict', 'installation stuck', 'upgrade failed', 'update failed', 'patch failed',
          'migration failed', 'rollback failed', 'configuration error', 'environment variable missing',
          'permission denied', 'path not found', 'library not found'
        ]
      },
      {
        name: 'Database Errors',
        urgency: 'High',
        keywords: [
          'sql error', 'query failed', 'syntax error', 'constraint violation', 'duplicate entry',
          'foreign key error', 'deadlock detected', 'db connection failed', 'cannot connect to db',
          'connection timeout', 'authentication failed', 'replication lag', 'data mismatch', 'missing records',
          'wrong data', 'null values', 'inconsistent data', 'slow query', 'index missing', 'lock timeout'
        ]
      },
      {
        name: 'Performance Issues',
        urgency: 'Medium',
        keywords: [
          'slow loading', 'response time high', 'timeout error', 'lagging', 'delay', 'high traffic', 'overload',
          'scaling issue', 'auto-scaling failed', 'memory leak', 'cpu spike', 'thread blocked',
          'concurrency issue', 'performance degradation', 'long processing time', 'system slow'
        ]
      }
    ]
  },
  {
    category: 'Finance Department',
    subcategories: [
      {
        name: 'Refund Requests',
        urgency: 'Medium',
        keywords: [
          'refund request', 'money back', 'return payment', 'refund not processed', 'refund delayed',
          'refund status', 'refund pending', 'cancellation refund', 'duplicate payment refund', 'chargeback request'
        ]
      },
      {
        name: 'Payment Failure',
        urgency: 'High',
        keywords: [
          'payment failed', 'transaction failed', 'payment declined', 'card declined', 'payment error',
          'transaction error', 'gateway error', 'upi failed', 'net banking failed', 'insufficient balance',
          'payment timeout', 'amount deducted but failed'
        ]
      },
      {
        name: 'Invoice Generation',
        urgency: 'Medium',
        keywords: [
          'invoice not generated', 'invoice missing', 'invoice download issue', 'bill not received',
          'invoice correction', 'invoice mismatch', 'wrong invoice amount', 'regenerate invoice', 'invoice pdf error'
        ]
      },
      {
        name: 'Tax Queries',
        urgency: 'Low',
        keywords: [
          'gst issue', 'tax calculation error', 'incorrect tax', 'tax invoice', 'vat issue', 'tds issue',
          'tax exemption', 'tax breakdown missing', 'wrong gst number', 'tax compliance'
        ]
      },
      {
        name: 'Vendor Payment Issues',
        urgency: 'Medium',
        keywords: [
          'vendor payment delayed', 'supplier payment pending', 'payout failed', 'payment not released',
          'settlement issue', 'vendor invoice pending', 'partner payment issue'
        ]
      },
      {
        name: 'Subscription Charges',
        urgency: 'Medium',
        keywords: [
          'subscription charged twice', 'recurring payment issue', 'subscription renewal failed',
          'auto renewal issue', 'wrong plan charge', 'subscription cancellation issue', 'renewal amount incorrect'
        ]
      }
    ]
  },
  {
    category: 'Security Department',
    subcategories: [
      {
        name: 'Account Compromise',
        urgency: 'Critical',
        keywords: [
          'account hacked', 'account compromised', 'password changed without permission', 'unauthorized login',
          'suspicious login', 'unknown device login', 'credentials stolen', 'account takeover'
        ]
      },
      {
        name: 'Suspicious Activity',
        urgency: 'High',
        keywords: [
          'unusual activity', 'suspicious transaction', 'abnormal login', 'multiple failed attempts',
          'brute force attempt', 'suspicious ip', 'abnormal behavior detected'
        ]
      },
      {
        name: 'Data Breach Report',
        urgency: 'Critical',
        keywords: [
          'data breach', 'data leak', 'information exposed', 'security incident', 'database leak',
          'unauthorized data access', 'confidential data exposed'
        ]
      },
      {
        name: 'Unauthorized Access',
        urgency: 'Critical',
        keywords: [
          'access without permission', 'unauthorized access', 'privilege misuse',
          'restricted data accessed', 'role misuse', 'permission bypass'
        ]
      },
      {
        name: 'Phishing Complaint',
        urgency: 'High',
        keywords: [
          'phishing email', 'fake email', 'scam message', 'fraudulent link', 'spoofed email',
          'suspicious attachment', 'email fraud', 'malicious link'
        ]
      },
      {
        name: 'Role/Permission Escalation',
        urgency: 'High',
        keywords: [
          'role change request', 'permission upgrade', 'access level increase', 'admin access request',
          'privilege escalation', 'role mismatch', 'incorrect permissions'
        ]
      }
    ]
  },
  {
    category: 'Customer Service',
    subcategories: [
      {
        name: 'Product Inquiry',
        urgency: 'Low',
        keywords: [
          'product details', 'pricing inquiry', 'feature information', 'availability check',
          'demo request', 'product comparison', 'service details'
        ]
      },
      {
        name: 'Service Request',
        urgency: 'Medium',
        keywords: [
          'new service request', 'activate service', 'service activation', 'account setup',
          'configuration request', 'onboarding help'
        ]
      },
      {
        name: 'Complaint',
        urgency: 'High',
        keywords: [
          'complaint', 'dissatisfied', 'bad experience', 'poor service', 'unhappy customer',
          'escalation request', 'issue unresolved'
        ]
      },
      {
        name: 'Feedback',
        urgency: 'Low',
        keywords: [
          'feedback', 'suggestion', 'review', 'improvement', 'user opinion', 'rating', 'appreciation message'
        ]
      },
      {
        name: 'Feature Request',
        urgency: 'Low',
        keywords: [
          'new feature request', 'feature suggestion', 'enhancement request', 'improvement request',
          'add functionality', 'product enhancement'
        ]
      },
      {
        name: 'SLA Concern',
        urgency: 'High',
        keywords: [
          'sla breach', 'delay in response', 'response time exceeded',
          'ticket pending too long', 'resolution delayed', 'escalation required'
        ]
      }
    ]
  },
  {
    category: 'Billing Department',
    subcategories: [
      {
        name: 'Incorrect Charges',
        urgency: 'High',
        keywords: [
          'wrong charge', 'extra charge', 'double charge', 'billing error', 'overcharged',
          'unexpected deduction', 'incorrect billing amount'
        ]
      },
      {
        name: 'Plan Upgrade/Downgrade',
        urgency: 'Medium',
        keywords: [
          'upgrade plan', 'downgrade plan', 'change subscription plan', 'switch plan', 'plan migration',
          'plan modification'
        ]
      },
      {
        name: 'Billing Cycle Change',
        urgency: 'Low',
        keywords: [
          'change billing cycle', 'monthly to yearly', 'yearly to monthly', 'billing date change',
          'invoice date issue', 'renewal date change'
        ]
      },
      {
        name: 'Auto-debit Failure',
        urgency: 'High',
        keywords: [
          'auto debit failed', 'recurring payment failed', 'automatic payment error',
          'auto renewal failed', 'mandate failed'
        ]
      },
      {
        name: 'Discount/Coupon Issue',
        urgency: 'Medium',
        keywords: [
          'coupon not working', 'discount not applied', 'promo code invalid', 'offer expired',
          'voucher issue', 'discount calculation error'
        ]
      }
    ]
  }
];

export function getSubjectKeywordOptions() {
  const seen = new Set();
  const options = [];
  for (const dept of TICKET_TAXONOMY) {
    for (const sub of dept.subcategories) {
      for (const kw of sub.keywords) {
        const normalized = kw.trim().toLowerCase();
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        options.push(kw.trim());
      }
    }
  }
  return options.sort((a, b) => a.localeCompare(b));
}
