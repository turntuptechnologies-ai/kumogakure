import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for `/.well-known/agents.json`, the agents.json spec that
// describes LLM-callable flows on top of an OpenAPI source. The source
// points at the relative `/openapi.json`, which is itself a decoy
// (`swagger-fake`), so a scanner following the manifest stays on bait.
// All values are fabricated per docs/RESPONSE_TEMPLATE_POLICY.md.

const body = JSON.stringify({
  agentsJson: '0.1.0',
  info: {
    title: 'Example API agent flows',
    version: '1.0.0',
    description: 'Flows for agents operating the internal example API.',
  },
  sources: [{ id: 'example', path: '/openapi.json' }],
  overrides: [],
  flows: [
    {
      id: 'list_users',
      title: 'List users',
      description: 'Return every user account.',
      actions: [{ id: 'list_users_action', sourceId: 'example', operationId: 'listUsers' }],
      links: [],
      fields: { parameters: [], responses: { success: { type: 'array' } } },
    },
    {
      id: 'login',
      title: 'Authenticate',
      description: 'Authenticate with a username and password and return a session token.',
      actions: [{ id: 'login_action', sourceId: 'example', operationId: 'login' }],
      links: [],
      fields: {
        parameters: [],
        requestBody: {
          type: 'object',
          properties: { username: { type: 'string' }, password: { type: 'string' } },
          required: ['username', 'password'],
        },
        responses: { success: { type: 'object' } },
      },
    },
  ],
});

export const agentsJson: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
