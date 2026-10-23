import type { TemplateFn } from '../../types.js';
import { PROTOCOL_VERSION, SERVER_INFO, TOOLS } from './mcp.js';

// Tier 2 decoy for MCP server discovery (`/.well-known/mcp`, the
// `server-card.json` draft). Advertises the same fabricated server as
// the `mcp` decoy and points the transport at the relative `/mcp`
// endpoint, so a scanner that follows the card lands on the JSON-RPC
// decoy and its handshake / tool calls are captured. No auth is
// advertised, which is what makes the card worth following.

const body = JSON.stringify({
  version: '1.0',
  protocolVersion: PROTOCOL_VERSION,
  serverInfo: { ...SERVER_INFO, title: 'Ops MCP Gateway' },
  description: 'Internal operations gateway: shell, filesystem, database and HTTP tools.',
  transport: { type: 'streamable-http', endpoint: '/mcp' },
  capabilities: {
    tools: { listChanged: false },
    resources: { listChanged: false, subscribe: false },
    prompts: { listChanged: false },
  },
  authentication: { required: false, schemes: [] },
  tools: TOOLS.map(({ name, description }) => ({ name, description })),
  resources: 'dynamic',
  prompts: 'dynamic',
});

export const mcpServerCard: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
