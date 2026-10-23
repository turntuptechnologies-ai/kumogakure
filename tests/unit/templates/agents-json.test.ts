import { describe, expect, it } from 'vitest';
import { agentsJson } from '../../../src/bait/templates/agents-json.js';

const ctx = {
  request: new Request('http://example.test/.well-known/agents.json'),
  path: '/.well-known/agents.json',
  category: 'mcp-recon' as const,
  subcategory: 'agents-json',
};

interface AgentsManifest {
  agentsJson: string;
  sources: { id: string; path: string }[];
  flows: { id: string; actions: { sourceId: string }[] }[];
}

describe('agents-json', () => {
  it('returns an agents.json manifest sourced from the /openapi.json decoy', async () => {
    const response = agentsJson(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const manifest = (await response.json()) as AgentsManifest;
    expect(manifest.agentsJson).toBe('0.1.0');
    expect(manifest.sources).toEqual([{ id: 'example', path: '/openapi.json' }]);
  });

  it('only references declared sources from its flows', async () => {
    const manifest = (await agentsJson(ctx).json()) as AgentsManifest;
    const sourceIds = new Set(manifest.sources.map((s) => s.id));
    expect(manifest.flows.length).toBeGreaterThan(0);
    for (const flow of manifest.flows) {
      for (const action of flow.actions) expect(sourceIds.has(action.sourceId)).toBe(true);
    }
  });
});
