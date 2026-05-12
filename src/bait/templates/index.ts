import type { TemplateFn, TemplateName } from '../../types.js';

const notFound: TemplateFn = () => {
  return new Response('Not Found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

const templates: Record<string, TemplateFn> = {
  'not-found': notFound,
};

export function getTemplate(name: TemplateName): TemplateFn {
  return templates[name] ?? notFound;
}

export function registerTemplate(name: TemplateName, fn: TemplateFn): void {
  templates[name] = fn;
}
