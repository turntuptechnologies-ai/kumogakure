import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for A2A (Agent2Agent) agent discovery: the Agent Card
// served at `/.well-known/agent-card.json` (and the pre-0.3 name
// `/.well-known/agent.json`). Format-valid card for an invented internal
// ops agent with no security schemes declared. All values are fabricated
// (`.invalid` domains, invented provider) per
// docs/RESPONSE_TEMPLATE_POLICY.md.

const body = JSON.stringify({
  protocolVersion: '0.3.0',
  name: 'ops-assistant',
  description: 'Internal operations agent: runs maintenance tasks and answers infra questions.',
  url: 'https://agents.example.invalid/a2a',
  preferredTransport: 'JSONRPC',
  version: '1.4.2',
  provider: { organization: 'Example Ops', url: 'https://example.invalid' },
  capabilities: { streaming: true, pushNotifications: false },
  defaultInputModes: ['text/plain', 'application/json'],
  defaultOutputModes: ['text/plain', 'application/json'],
  skills: [
    {
      id: 'run-maintenance',
      name: 'Run maintenance task',
      description: 'Execute a maintenance command on the application hosts.',
      tags: ['ops', 'shell'],
      examples: ['restart the worker pool', 'show disk usage on app hosts'],
    },
    {
      id: 'query-data',
      name: 'Query application data',
      description: 'Answer questions by querying the primary application database.',
      tags: ['database', 'sql'],
      examples: ['how many users signed up yesterday?'],
    },
  ],
});

export const a2aAgentCard: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
