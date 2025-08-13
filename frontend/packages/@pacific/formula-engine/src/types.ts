export interface FormulaVariable {
  name: string;
  description?: string;
  type?: 'number' | 'percentage' | 'currency' | 'boolean' | 'array' | 'object';
  source?: string;
}

export interface FormulaContext {
  variables: Record<string, any>;
  parameters?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface FormulaResult {
  value: any;
  executionTime: number;
  usedVariables: string[];
  errors?: string[];
}

export interface FormulaValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  usedVariables: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export interface FormulaParseResult {
  ast: any;
  variables: string[];
  functions: string[];
  isValid: boolean;
  errors: string[];
}