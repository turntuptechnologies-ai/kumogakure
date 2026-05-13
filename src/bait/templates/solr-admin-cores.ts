import type { TemplateFn } from '../../types.js';

const body = JSON.stringify({
  responseHeader: { status: 0, QTime: 5 },
  initFailures: {},
  status: {},
});

export const solrAdminCores: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
