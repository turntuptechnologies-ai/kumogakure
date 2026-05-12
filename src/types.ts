export type BaitCategory =
  | 'cms-auth'
  | 'config-leak'
  | 'cve-recon'
  | 'ssrf-bait'
  | 'webshell'
  | 'api-recon'
  | 'iot-recon'
  | 'unknown';

export type SignalName =
  | 'log4j'
  | 'spring4shell'
  | 'sqli'
  | 'xss'
  | 'path-traversal'
  | 'cmd-injection'
  | 'xxe'
  | 'ssti'
  | 'ssrf-meta'
  | 'nosqli'
  | 'ldap-injection'
  | 'crlf'
  | 'open-redirect';

export type TemplateName = string;

export interface TemplateContext {
  request: Request;
  path: string;
  category: BaitCategory;
  subcategory?: string;
}

export type TemplateFn = (ctx: TemplateContext) => Response;

export interface BaitEntry {
  path: string;
  category: BaitCategory;
  subcategory?: string;
  template: TemplateName;
}

export interface PatternEntry {
  pattern: RegExp;
  category: BaitCategory;
  subcategory?: string;
  template: TemplateName;
}

export interface Env {
  DB: D1Database;
  PAYLOADS: R2Bucket;
  BODY_R2_THRESHOLD: string;
  RETENTION_DAYS: string;
}

export interface RequestRecord {
  id: string;
  ts: number;
  ip?: string;
  asn?: number;
  asn_org?: string;
  country?: string;
  method: string;
  path: string;
  query?: string;
  ua?: string;
  category?: BaitCategory;
  subcategory?: string;
  status: number;
  body_size?: number;
  r2_key?: string;
  signals?: SignalName[];
  tls_version?: string;
  tls_cipher?: string;
}
