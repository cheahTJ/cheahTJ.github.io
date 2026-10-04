// Newest first. Shared by the work reader and the 3D desk monitor.
export const journey = [
  {
    company: 'Ant Group',
    role: 'Java Backend Engineer Intern',
    date: 'Sep — Dec 2025',
    year: '2025',
    theme: 'Backend services for recurring payments.',
    intro: '',
    points: [
      'Developed and maintained Java and Spring Boot microservices for Antom’s subscription-payment product, using schedulers, message queues and middleware to support recurring payment events.',
      'Built a clock-advancement feature exposed through public-facing APIs. Users could advance time and trigger subscription events to explore the full subscription lifecycle.',
    ],
    highlight:
      'Subscription-payment services and a clock-advancement API feature.',
    tech: [
      'Java',
      'Spring Boot',
      'Microservices',
      'Schedulers / Message queues',
    ],
    domain: 'Payments · Backend systems',
  },
  {
    company: 'Clifford Capital',
    role: 'Software Engineer Intern',
    date: 'May — Aug 2025',
    year: '2025',
    theme: 'An internal application for credit and lending.',
    intro:
      'Built a web application for Front Office teams to manage credit-rating and loan-origination workflows across the company.',
    points: [
      'Developed the application with a React frontend, Node.js and Express backend, and Supabase.',
      'Deployed it on Azure App Service, bringing related credit and lending steps into a connected workflow.',
    ],
    highlight:
      'A deployed internal application for credit and lending workflows.',
    tech: ['React', 'Node.js / Express', 'Supabase', 'Azure App Service'],
    domain: 'Financial services · Internal products',
  },
  {
    company: 'Global OneClick',
    role: 'Full Stack Intern',
    date: 'Jul 2024 — Jan 2025',
    year: '2024–25',
    theme: 'Customer targeting informed by analytics.',
    intro:
      'Worked on a customer-targeting product that used in-house algorithms and behavioural data to support advertising decisions.',
    points: [
      'Built the targeting workflow across a Vue and TypeScript frontend and a Java Spring Boot backend with MyBatis-Plus.',
      'Analysed Google Analytics 4 data with BigQuery and Python to understand customer behaviour and average conversion cycles.',
      'Developed rules to identify users more likely to convert, supporting more targeted ad placement.',
    ],
    highlight:
      'Connected customer analytics with a full-stack targeting workflow.',
    tech: ['Vue / TypeScript', 'Java / Spring Boot', 'BigQuery', 'Python'],
    domain: 'Customer analytics · Full stack',
  },
  {
    company: 'Explico',
    role: 'AI Engineer Intern',
    date: 'May — Jun 2024',
    year: '2024',
    theme: 'Personalised practice and AI grading.',
    intro:
      'Developed AI services for an education platform with 10,000+ users, helping students practise questions suited to their learning needs.',
    points: [
      'Built Python Flask APIs for ML-powered question recommendations based on students’ weaknesses.',
      'Created an in-house generative AI grading solution using Google Vertex AI.',
      'Deployed the ML services using Docker, Microsoft IIS and Google Cloud, including App Engine and Cloud SQL.',
    ],
    highlight: 'AI services for an education platform with 10,000+ users.',
    tech: ['Python / Flask', 'Vertex AI', 'Docker', 'Google Cloud'],
    domain: 'Education · Applied AI',
  },
  {
    company: 'IMDA',
    role: 'Software Engineer Intern',
    date: 'May — Jul 2023',
    year: '2023',
    theme: 'An AI assistant for HR knowledge.',
    intro:
      'Built a Slack-based assistant that helped HR staff find answers in internal documents.',
    points: [
      'Used GPT, LangChain and ChromaDB to retrieve relevant information and generate responses directly in Slack.',
      'Automated document lookup, helping double HR productivity by reducing manual document scanning.',
    ],
    highlight: 'The team’s GenAI SlackBot won an IMDA Award in 2024.',
    tech: ['GPT', 'LangChain', 'ChromaDB'],
    domain: 'Public sector · Knowledge tools',
  },
];
