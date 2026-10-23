import { describe, expect, it } from 'vitest';
import { a2aAgentCard } from '../../../src/bait/templates/a2a-agent-card.js';

const ctx = {
  request: new Request('http://example.test/.well-known/agent-card.json'),
  path: '/.well-known/agent-card.json',
  category: 'mcp-recon' as const,
  subcategory: 'a2a-agent-card',
};

interface AgentCard {
  protocolVersion: string;
  name: string;
  url: string;
  provider: { url: string };
  skills: { id: string }[];
  securitySchemes?: unknown;
}

describe('a2a-agent-card', () => {
  it('returns a format-valid A2A agent card', async () => {
    const response = a2aAgentCard(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const card = (await response.json()) as AgentCard;
    expect(card.protocolVersion).toBe('0.3.0');
    expect(card.name).toBeTruthy();
    expect(card.skills.length).toBeGreaterThan(0);
    expect(card.securitySchemes).toBeUndefined();
  });

  it('uses only .invalid domains for absolute URLs', async () => {
    const card = (await a2aAgentCard(ctx).json()) as AgentCard;
    for (const url of [card.url, card.provider.url]) {
      expect(new URL(url).hostname.endsWith('.invalid')).toBe(true);
    }
  });
});
