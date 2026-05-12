import type { SignalName } from '../types.js';
import { signalPatterns } from './patterns.js';

export function detectInString(input: string): SignalName[] {
  const hits = new Set<SignalName>();
  for (const { name, matchers } of signalPatterns) {
    for (const matcher of matchers) {
      if (matcher.test(input)) {
        hits.add(name);
        break;
      }
    }
  }
  return [...hits];
}

export function detectAcross(request: Request, body: string): SignalName[] {
  const haystacks: string[] = [request.url, body];
  for (const [key, value] of request.headers.entries()) {
    haystacks.push(`${key}: ${value}`);
  }

  const allHits = new Set<SignalName>();
  for (const input of haystacks) {
    for (const hit of detectInString(input)) {
      allHits.add(hit);
    }
  }
  return [...allHits];
}
