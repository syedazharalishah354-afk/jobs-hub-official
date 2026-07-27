import { DEFAULT_JOBS, DEFAULT_SETTINGS } from '../../src/constants/defaultData.js';

interface NetlifyEvent {
  path: string;
  httpMethod: string;
  queryStringParameters?: Record<string, string>;
  headers?: Record<string, string>;
  body?: string | null;
}

export const handler = async (event: NetlifyEvent) => {
  const path = event.path || '';
  const method = (event.httpMethod || 'GET').toUpperCase();

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // GET /api/jobs
  if (path.includes('/api/jobs') && method === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(DEFAULT_JOBS)
    };
  }

  // GET /api/config
  if (path.includes('/api/config') && method === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(DEFAULT_SETTINGS)
    };
  }

  // POST /api/applications/step1
  if (path.includes('/api/applications/step1') && method === 'POST') {
    try {
      const payload = JSON.parse(event.body || '{}');
      const refNum = `JH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const now = new Date().toISOString();
      const appRecord = {
        id: `app-${Date.now()}`,
        referenceNo: refNum,
        status: 'Payment Pending',
        createdAt: now,
        updatedAt: now,
        ...payload
      };
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ message: 'Application submitted successfully', application: appRecord })
      };
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid application payload' })
      };
    }
  }

  // GET /api/applications/track
  if (path.includes('/api/applications/track') && method === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ applications: [] })
    };
  }

  // Fallback for Netlify API Function
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ status: 'ok', jobs: DEFAULT_JOBS, settings: DEFAULT_SETTINGS })
  };
};

export default handler;
