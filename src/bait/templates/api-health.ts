import type { TemplateFn } from '../../types.js';

const body = JSON.stringify({ status: 'ok' });

export const apiHealth: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
