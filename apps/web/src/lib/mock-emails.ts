export interface Email {
  id: string;
  from: {
    name: string;
    email: string;
  };
  to: {
    name: string;
    email: string;
  }[];
  subject: string;
  body: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  folder: 'inbox' | 'sent' | 'spam' | 'deleted';
  priority: 'low' | 'normal' | 'high';
}

const generateMockEmail = (id: string, overrides: Partial<Email>): Email => ({
  id,
  from: {
    name: 'John Doe',
    email: 'john@example.com'
  },
  to: [{
    name: 'Test User',
    email: 'test@example.com'
  }],
  subject: 'Sample Email Subject',
  body: 'This is a sample email body content.',
  date: new Date(),
  isRead: false,
  isStarred: false,
  hasAttachments: false,
  folder: 'inbox',
  priority: 'normal',
  ...overrides
});

export const mockEmails: { [key: string]: Email[] } = {
  inbox: [
    generateMockEmail('inbox-1', {
      from: { name: 'Sarah Wilson', email: 'sarah.wilson@company.com' },
      subject: 'Project Update - Q4 2025 Planning',
      body: 'Hi there! I hope this email finds you well. I wanted to provide you with an update on our Q4 2025 planning initiatives. We have made significant progress on the roadmap and would like to schedule a meeting to discuss the next steps. Please let me know your availability for next week.',
      date: new Date('2025-01-20T09:30:00'),
      isRead: false,
      priority: 'high',
      hasAttachments: true
    }),
    generateMockEmail('inbox-2', {
      from: { name: 'Alex Chen', email: 'alex@techcorp.io' },
      subject: 'New Feature Proposal: Dashboard Analytics',
      body: 'Hello! I have been working on a proposal for adding advanced analytics to our dashboard. The proposed features include real-time metrics, customizable widgets, and export functionality. I would love to get your feedback on this.',
      date: new Date('2025-01-20T08:15:00'),
      isRead: true,
      priority: 'normal'
    }),
    generateMockEmail('inbox-3', {
      from: { name: 'Marketing Team', email: 'marketing@noessi.com' },
      subject: 'Weekly Newsletter - Latest Updates',
      body: 'Check out our latest newsletter with product updates, customer success stories, and upcoming events. This week we are featuring our new email client capabilities and user testimonials.',
      date: new Date('2025-01-19T16:45:00'),
      isRead: true,
      priority: 'low'
    }),
    generateMockEmail('inbox-4', {
      from: { name: 'David Rodriguez', email: 'david.r@consultancy.com' },
      subject: 'Meeting Confirmation - Tomorrow 2 PM',
      body: 'Just confirming our meeting scheduled for tomorrow at 2 PM. We will be discussing the integration timeline and technical requirements. The meeting will be held via video conference.',
      date: new Date('2025-01-19T14:20:00'),
      isRead: false,
      priority: 'high',
      isStarred: true
    }),
    generateMockEmail('inbox-5', {
      from: { name: 'Support Team', email: 'support@service.com' },
      subject: 'Your Support Ticket #12345 has been resolved',
      body: 'We are pleased to inform you that your support ticket regarding login issues has been resolved. Our team has implemented the necessary fixes and your account should now be fully functional.',
      date: new Date('2025-01-18T11:30:00'),
      isRead: true,
      priority: 'normal'
    })
  ],

  sent: [
    generateMockEmail('sent-1', {
      from: { name: 'Test User', email: 'test@example.com' },
      to: [{ name: 'Sarah Wilson', email: 'sarah.wilson@company.com' }],
      subject: 'Re: Project Update - Q4 2025 Planning',
      body: 'Thank you for the update, Sarah. I am available for a meeting next Tuesday or Wednesday afternoon. Please let me know which time works better for you and I will send out the calendar invitation.',
      date: new Date('2025-01-20T10:15:00'),
      isRead: true,
      folder: 'sent'
    }),
    generateMockEmail('sent-2', {
      from: { name: 'Test User', email: 'test@example.com' },
      to: [{ name: 'Team Lead', email: 'team.lead@company.com' }],
      subject: 'Status Report - Week of Jan 15th',
      body: 'Please find attached the weekly status report covering completed tasks, ongoing projects, and upcoming milestones. All deliverables are on track for the planned timeline.',
      date: new Date('2025-01-19T17:30:00'),
      isRead: true,
      folder: 'sent',
      hasAttachments: true
    }),
    generateMockEmail('sent-3', {
      from: { name: 'Test User', email: 'test@example.com' },
      to: [{ name: 'Client Services', email: 'client@business.com' }],
      subject: 'Follow-up on our discussion',
      body: 'Following up on our conversation earlier today. I have reviewed the requirements and believe we can implement the requested features within the proposed timeline.',
      date: new Date('2025-01-18T15:45:00'),
      isRead: true,
      folder: 'sent'
    })
  ],

  spam: [
    generateMockEmail('spam-1', {
      from: { name: 'Special Offers', email: 'noreply@deals.spam' },
      subject: 'URGENT: Claim Your Prize Now!!!',
      body: 'Congratulations! You have won a special prize worth $1000. Click here immediately to claim your reward before it expires. Limited time offer!',
      date: new Date('2025-01-20T06:30:00'),
      isRead: false,
      folder: 'spam',
      priority: 'low'
    }),
    generateMockEmail('spam-2', {
      from: { name: 'Crypto Investment', email: 'invest@crypto.fake' },
      subject: 'Make Money Fast - Crypto Opportunity',
      body: 'Don not miss this incredible cryptocurrency investment opportunity. Guaranteed returns of 500% in just 30 days. Invest now and become rich!',
      date: new Date('2025-01-19T23:15:00'),
      isRead: false,
      folder: 'spam'
    }),
    generateMockEmail('spam-3', {
      from: { name: 'Pharmacy Online', email: 'meds@pharmacy.scam' },
      subject: 'Cheap Medications - No Prescription Required',
      body: 'Get all your medications at discount prices without prescription. Fast shipping worldwide. Order now and save up to 80% on all products.',
      date: new Date('2025-01-18T20:45:00'),
      isRead: true,
      folder: 'spam'
    })
  ],

  deleted: [
    generateMockEmail('deleted-1', {
      from: { name: 'Old Newsletter', email: 'newsletter@oldcompany.com' },
      subject: 'Monthly Update - December 2024',
      body: 'This is an outdated newsletter that was previously deleted. It contains information about company updates from last month.',
      date: new Date('2024-12-15T12:00:00'),
      isRead: true,
      folder: 'deleted'
    }),
    generateMockEmail('deleted-2', {
      from: { name: 'Expired Event', email: 'events@conference.com' },
      subject: 'Conference Registration Reminder',
      body: 'This was a reminder for a conference that has already passed. The event took place last month and this email is no longer relevant.',
      date: new Date('2024-12-10T14:30:00'),
      isRead: false,
      folder: 'deleted'
    })
  ]
};

export const getEmailsByFolder = (folder: string): Email[] => {
  return mockEmails[folder] || [];
};

export const getEmailById = (id: string): Email | undefined => {
  for (const folderEmails of Object.values(mockEmails)) {
    const email = folderEmails.find(email => email.id === id);
    if (email) return email;
  }
  return undefined;
};