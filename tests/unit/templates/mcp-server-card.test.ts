import { describe, expect, it } from 'vitest';
import { SERVER_INFO, TOOLS } from '../../../src/bait/templates/mcp.js';
import { mcpServerCard } from '../../../src/bait/templates/mcp-server-card.js';

const ctx = {
  request: new Request('http://example.test/.well-known/mcp/server-card.json'),
  path: '/.well-known/mcp/server-card.json',
  category: 'mcp-recon' as const,
  subcategory: 'mcp-discovery',
};

interface ServerCard {
  serverInfo: { name: string; version: string };
  transport: { type: string; endpoint: string };
  authentication: { required: boolean };
  tools: { name: string }[];
}

describe('mcp-server-card', () => {
  it('returns a JSON server card pointing at the /mcp decoy', async () => {
    const response = mcpServerCard(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const card = (await response.json()) as ServerCard;
    expect(card.transport).toEqual({ type: 'streamable-http', endpoint: '/mcp' });
    expect(card.authentication.required).toBe(false);
  });

  it('advertises the same server and tools as the mcp decoy', async () => {
    const card = (await mcpServerCard(ctx).json()) as ServerCard;
    expect(card.serverInfo.name).toBe(SERVER_INFO.name);
    expect(card.serverInfo.version).toBe(SERVER_INFO.version);
    expect(card.tools.map((t) => t.name)).toEqual(TOOLS.map((t) => t.name));
  });
});
