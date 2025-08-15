import { evaluate, MathNode } from 'mathjs';
import { FormulaContext, FormulaResult } from './types';
import { FormulaParser } from './parser';

export class FormulaExecutor {
  private parser: FormulaParser;
  private maxExecutionTime: number = 5000; // 5 seconds

  constructor() {
    this.parser = new FormulaParser();
  }

  async execute(
    expression: string, 
    context: FormulaContext
  ): Promise<FormulaResult> {
    const startTime = performance.now();
    const result: FormulaResult = {
      value: null,
      executionTime: 0,
      usedVariables: [],
      errors: []
    };

    try {
      // Parse and validate first
      const parseResult = this.parser.parse(expression);
      if (!parseResult.isValid) {
        result.errors = parseResult.errors;
        return result;
      }

      // Create a safe evaluation scope
      const scope = this.createScope(context);

      // Track which variables were actually used
      const usedVars = new Set<string>();
      const wrappedScope = new Proxy(scope, {
        get(target, prop) {
          if (typeof prop === 'string' && prop in target) {
            usedVars.add(prop);
          }
          return target[prop as string];
        }
      });

      // Execute with timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Formula execution timeout')), this.maxExecutionTime);
      });

      const executionPromise = Promise.resolve(evaluate(expression, wrappedScope));

      result.value = await Promise.race([executionPromise, timeoutPromise]);
      result.usedVariables = Array.from(usedVars);

    } catch (error: any) {
      if (!result.errors) {
        result.errors = [];
      }
      result.errors.push(`Execution error: ${error.message}`);
    }

    result.executionTime = performance.now() - startTime;
    return result;
  }

  private createScope(context: FormulaContext): Record<string, any> {
    const scope: Record<string, any> = {};

    // Add variables
    if (context.variables) {
      Object.entries(context.variables).forEach(([key, value]) => {
        scope[key] = this.sanitizeValue(value);
      });
    }

    // Add parameters
    if (context.parameters) {
      Object.entries(context.parameters).forEach(([key, value]) => {
        scope[key] = this.sanitizeValue(value);
      });
    }

    // Add safe helper functions
    scope.APPLY_RANGE = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    scope.PERCENT_CHANGE = (oldVal: number, newVal: number) => {
      if (oldVal === 0) return 0;
      return ((newVal - oldVal) / oldVal) * 100;
    };

    scope.CLAMP = (value: number, min: number, max: number) => {
      return Math.max(min, Math.min(max, value));
    };

    scope.ROUND_TO = (value: number, decimals: number) => {
      const factor = Math.pow(10, decimals);
      return Math.round(value * factor) / factor;
    };

    scope.DAYS_BETWEEN = (date1: Date | string, date2: Date | string) => {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return scope;
  }

  private sanitizeValue(value: any): any {
    // Ensure numbers are properly formatted
    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        return 0;
      }
      return value;
    }

    // Convert string numbers
    if (typeof value === 'string' && /^-?\d+\.?\d*$/.test(value)) {
      return parseFloat(value);
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(v => this.sanitizeValue(v));
    }

    // Handle objects (for complex data structures)
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      const sanitized: Record<string, any> = {};
      Object.entries(value).forEach(([key, val]) => {
        sanitized[key] = this.sanitizeValue(val);
      });
      return sanitized;
    }

    return value;
  }

  // Batch execution for multiple formulas
  async executeBatch(
    formulas: Array<{ name: string; expression: string }>,
    context: FormulaContext
  ): Promise<Record<string, FormulaResult>> {
    const results: Record<string, FormulaResult> = {};

    // Execute in parallel for performance
    await Promise.all(
      formulas.map(async ({ name, expression }) => {
        results[name] = await this.execute(expression, context);
      })
    );

    return results;
  }
}