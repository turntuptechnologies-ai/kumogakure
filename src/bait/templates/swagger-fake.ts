import type { TemplateFn } from '../../types.js';

const body = JSON.stringify({
  openapi: '3.0.3',
  info: {
    title: 'Example API',
    version: '1.0.0',
    description: 'Internal example API.',
  },
  servers: [{ url: 'https://api.example.invalid' }],
  paths: {
    '/users': {
      get: {
        summary: 'List users',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
});

export const swaggerFake: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
