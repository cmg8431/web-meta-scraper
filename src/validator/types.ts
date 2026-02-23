import type { ResolvedMetadata } from '../types/result';

export type Severity = 'error' | 'warning' | 'info';

export type ValidationCategory =
  | 'essential'
  | 'opengraph'
  | 'twitter'
  | 'structured-data'
  | 'security';

export interface ValidationIssue {
  severity: Severity;
  category: ValidationCategory;
  field: string;
  message: string;
}

export interface ValidationRule {
  category: ValidationCategory;
  field: string;
  severity: Severity;
  penalty: number;
  check: (
    metadata: ResolvedMetadata,
    sources: Record<string, Record<string, unknown>>,
  ) => string | null;
}

export interface ValidationResult {
  score: number;
  issues: ValidationIssue[];
  summary: { errors: number; warnings: number; info: number };
  metadata: ResolvedMetadata;
}
