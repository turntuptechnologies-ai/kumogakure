import type { TemplateFn } from '../../types.js';

export const springActuatorGeneric: TemplateFn = ({ path }) => {
  const body = JSON.stringify({
    timestamp: new Date().toISOString(),
    status: 404,
    error: 'Not Found',
    path,
  });
  return new Response(body, {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
};
