import type { TemplateFn } from '../../types.js';

const body = JSON.stringify({
  status: 'UP',
  groups: ['liveness', 'readiness'],
});

export const springActuatorHealth: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/vnd.spring-boot.actuator.v3+json' },
  });
};
