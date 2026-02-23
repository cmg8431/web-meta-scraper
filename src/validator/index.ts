import type { ScraperResult } from '../types/result';
import { validationRules } from './rules';
import type { ValidationIssue, ValidationResult } from './types';

export type {
  ValidationIssue,
  ValidationResult,
  ValidationRule,
} from './types';

export function validateMetadata(result: ScraperResult): ValidationResult {
  const { metadata, sources } = result;
  const issues: ValidationIssue[] = [];
  let score = 100;

  for (const rule of validationRules) {
    const message = rule.check(metadata, sources);
    if (message) {
      issues.push({
        severity: rule.severity,
        category: rule.category,
        field: rule.field,
        message,
      });
      score -= rule.penalty;
    }
  }

  score = Math.max(0, score);

  const summary = {
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };

  return { score, issues, summary, metadata };
}
