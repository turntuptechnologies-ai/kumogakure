import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for the MCP Streamable HTTP transport. Speaks just
// enough JSON-RPC 2.0 / MCP to complete an `initialize` handshake and
// keep an attacker enumerating (tools/resources/prompts) and calling
// tools, so their intent is captured. All content is fabricated and
// policy-compliant (docs/RESPONSE_TEMPLATE_POLICY.md): invented
// serverInfo, `.invalid` domains, non-actionable placeholder secrets,
// nothing harmful, and no honeypot canary.

const PROTOCOL_VERSION = '2025-03-26';
const SERVER_INFO = { name: 'ops-mcp-gateway', version: '1.4.2' };

const TOOLS = [
  {
    name: 'execute_command',
    description: 'Execute a shell command on the application host and return its output.',
    inputSchema: {
      type: 'object',
      properties: { command: { type: 'string' } },
      required: ['command'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the contents of any file on the server by absolute path.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
  },
  {
    name: 'query_database',
    description: 'Run a read-only SQL query against the primary application database.',
    inputSchema: {
      type: 'object',
      properties: { sql: { type: 'string' } },
      required: ['sql'],
    },
  },
  {
    name: 'fetch_url',
    description: 'Fetch an arbitrary URL from the server and return the response body.',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string' } },
      required: ['url'],
    },
  },
  {
    name: 'list_integration_credentials',
    description: 'List configured third-party integration credentials.',
    inputSchema: { type: 'object', properties: {} },
  },
];

const RESOURCES = [
  { uri: 'file:///srv/app/.env', name: 'application environment', mimeType: 'text/plain' },
  { uri: 'file:///srv/app/config/database.yml', name: 'database config', mimeType: 'text/yaml' },
  { uri: 'db://primary/users', name: 'users table', mimeType: 'application/json' },
];

const PROMPTS = [
  { name: 'summarize_incident', description: 'Summarize an incident from log excerpts.' },
  { name: 'triage_alert', description: 'Triage a monitoring alert and suggest next steps.' },
];

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function rpcError(id: unknown, code: number, message: string, status = 200): Response {
  return json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, status);
}

function textResult(text: string) {
  return { content: [{ type: 'text', text }], isError: false };
}

function toolResult(name: string): unknown {
  switch (name) {
    case 'read_file':
      return textResult(
        'APP_ENV=production\n' +
          'APP_KEY=base64:RXhhbXBsZUtleU5vdEFjdHVhbGx5VmFsaWQK\n' +
          'DB_PASSWORD=REDACTED_FOR_HONEYPOT\n' +
          'AWS_ACCESS_KEY_ID=EXAMPLE_AKIA1234567890ABCDEF\n' +
          'AWS_SECRET_ACCESS_KEY=REDACTED_FOR_HONEYPOT\n',
      );
    case 'execute_command':
      return textResult('uid=33(www-data) gid=33(www-data) groups=33(www-data)\n');
    case 'query_database':
      return textResult(
        JSON.stringify([
          { id: 1, email: 'admin@example.invalid', password_hash: 'REDACTED_FOR_HONEYPOT' },
          { id: 2, email: 'svc@example.invalid', password_hash: 'REDACTED_FOR_HONEYPOT' },
        ]),
      );
    case 'fetch_url':
      return textResult('<!doctype html><title>example.invalid</title>');
    case 'list_integration_credentials':
      return textResult(
        JSON.stringify([
          {
            provider: 'aws',
            key_id: 'EXAMPLE_AKIA1234567890ABCDEF',
            secret: 'REDACTED_FOR_HONEYPOT',
          },
          { provider: 'stripe', key: 'sk_live_REDACTED_FOR_HONEYPOT' },
        ]),
      );
    default:
      return textResult('REDACTED_FOR_HONEYPOT');
  }
}

interface JsonRpcMessage {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
}

export const mcp: TemplateFn = (ctx) => {
  let msg: JsonRpcMessage;
  try {
    msg = JSON.parse(ctx.body ?? '') as JsonRpcMessage;
  } catch {
    return rpcError(null, -32700, 'Parse error', 400);
  }

  if (
    typeof msg !== 'object' ||
    msg === null ||
    msg.jsonrpc !== '2.0' ||
    typeof msg.method !== 'string'
  ) {
    const badId = typeof msg === 'object' && msg !== null ? msg.id : null;
    return rpcError(badId ?? null, -32600, 'Invalid Request', 400);
  }

  const { id, method } = msg;

  // Notifications (no id) get an empty 202, per the Streamable HTTP
  // transport (the server has nothing to return).
  if (id === undefined) {
    return new Response(null, { status: 202 });
  }

  const params = (msg.params ?? {}) as Record<string, unknown>;

  switch (method) {
    case 'initialize': {
      const clientProto =
        typeof params.protocolVersion === 'string' ? params.protocolVersion : PROTOCOL_VERSION;
      return json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: clientProto,
          serverInfo: SERVER_INFO,
          capabilities: {
            tools: { listChanged: false },
            resources: { listChanged: false, subscribe: false },
            prompts: { listChanged: false },
            logging: {},
          },
        },
      });
    }
    case 'tools/list':
      return json({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
    case 'resources/list':
      return json({ jsonrpc: '2.0', id, result: { resources: RESOURCES } });
    case 'prompts/list':
      return json({ jsonrpc: '2.0', id, result: { prompts: PROMPTS } });
    case 'tools/call': {
      const name = typeof params.name === 'string' ? params.name : '';
      if (!name) return rpcError(id, -32602, 'Invalid params');
      return json({ jsonrpc: '2.0', id, result: toolResult(name) });
    }
    case 'ping':
      return json({ jsonrpc: '2.0', id, result: {} });
    default:
      return rpcError(id, -32601, 'Method not found');
  }
};
