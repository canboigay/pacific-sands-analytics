import { FormulaParser } from './parser';
import { FormulaExecutor } from './executor';
import { FormulaValidation, FormulaContext } from './types';

export interface ValidationRule {
  name: string;
  check: (expression: string, context?: FormulaContext) => Promise<{
    passed: boolean;
    message?: string;
  }>;
}

export class FormulaValidator {
  private parser: FormulaParser;
  private executor: FormulaExecutor;
  private customRules: ValidationRule[] = [];

  constructor() {
    this.parser = new FormulaParser();
    this.executor = new FormulaExecutor();
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // Syntax validation
    this.addRule({
      name: 'syntax',
      check: async (expression) => {
        const result = this.parser.parse(expression);
        return {
          passed: result.isValid,
          message: result.errors.join('; ')
        };
      }
    });

    // Variable validation
    this.addRule({
      name: 'variables',
      check: async (expression, context) => {
        const parseResult = this.parser.parse(expression);
        if (!context || !context.variables) {
          return { passed: true };
        }

        const missingVars = parseResult.variables.filter(
          v => !(v in context.variables)
        );

        return {
          passed: missingVars.length === 0,
          message: missingVars.length > 0 
            ? `Missing variables: ${missingVars.join(', ')}`
            : undefined
        };
      }
    });

    // Result range validation
    this.addRule({
      name: 'resultRange',
      check: async (expression, context) => {
        if (!context) return { passed: true };

        try {
          const result = await this.executor.execute(expression, context);
          const value = result.value;

          // Check if result is a reasonable number
          if (typeof value === 'number') {
            if (isNaN(value) || !isFinite(value)) {
              return {
                passed: false,
                message: 'Formula produces invalid number'
              };
            }

            // Check for unreasonable values (customizable per use case)
            if (Math.abs(value) > 1e9) {
              return {
                passed: false,
                message: 'Formula produces unreasonably large value'
              };
            }
          }

          return { passed: true };
        } catch (error) {
          return {
            passed: false,
            message: `Execution failed: ${error}`
          };
        }
      }
    });

    // Performance validation
    this.addRule({
      name: 'performance',
      check: async (expression, context) => {
        if (!context) return { passed: true };

        const result = await this.executor.execute(expression, context);
        
        // Warn if execution takes too long
        if (result.executionTime > 100) { // 100ms threshold
          return {
            passed: false,
            message: `Formula execution too slow: ${result.executionTime.toFixed(2)}ms`
          };
        }

        return { passed: true };
      }
    });

    // Security validation - no code injection
    this.addRule({
      name: 'security',
      check: async (expression) => {
        // Check for potentially dangerous patterns
        const dangerousPatterns = [
          /eval\s*\(/,
          /Function\s*\(/,
          /require\s*\(/,
          /import\s*\(/,
          /process\./,
          /global\./,
          /__proto__/,
          /constructor\s*\[/
        ];

        const hasDangerousPattern = dangerousPatterns.some(
          pattern => pattern.test(expression)
        );

        return {
          passed: !hasDangerousPattern,
          message: hasDangerousPattern 
            ? 'Formula contains potentially dangerous patterns'
            : undefined
        };
      }
    });
  }

  addRule(rule: ValidationRule) {
    this.customRules.push(rule);
  }

  async validateFormula(
    expression: string,
    context?: FormulaContext,
    testData?: Array<FormulaContext>
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    testResults?: Array<{
      input: FormulaContext;
      output: any;
      passed: boolean;
    }>;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Run all validation rules
    for (const rule of this.customRules) {
      const result = await rule.check(expression, context);
      if (!result.passed && result.message) {
        if (rule.name === 'performance') {
          warnings.push(result.message);
        } else {
          errors.push(result.message);
        }
      }
    }

    // Run test data if provided
    let testResults;
    if (testData && testData.length > 0) {
      testResults = await this.runTests(expression, testData);
      
      const failedTests = testResults.filter(t => !t.passed);
      if (failedTests.length > 0) {
        errors.push(`${failedTests.length} test(s) failed`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      testResults
    };
  }

  private async runTests(
    expression: string,
    testData: Array<FormulaContext>
  ): Promise<Array<{
    input: FormulaContext;
    output: any;
    passed: boolean;
  }>> {
    const results = [];

    for (const testCase of testData) {
      try {
        const result = await this.executor.execute(expression, testCase);
        results.push({
          input: testCase,
          output: result.value,
          passed: !result.errors || result.errors.length === 0
        });
      } catch (error) {
        results.push({
          input: testCase,
          output: null,
          passed: false
        });
      }
    }

    return results;
  }

  // Validate formula compatibility when migrating
  async validateMigration(
    oldExpression: string,
    newExpression: string,
    testData: Array<FormulaContext>
  ): Promise<{
    compatible: boolean;
    differences: Array<{
      input: FormulaContext;
      oldOutput: any;
      newOutput: any;
      percentDiff?: number;
    }>;
  }> {
    const differences = [];
    let compatible = true;

    for (const testCase of testData) {
      const oldResult = await this.executor.execute(oldExpression, testCase);
      const newResult = await this.executor.execute(newExpression, testCase);

      if (oldResult.value !== newResult.value) {
        const diff: any = {
          input: testCase,
          oldOutput: oldResult.value,
          newOutput: newResult.value
        };

        // Calculate percentage difference for numbers
        if (typeof oldResult.value === 'number' && 
            typeof newResult.value === 'number') {
          const percentDiff = Math.abs(
            ((newResult.value - oldResult.value) / oldResult.value) * 100
          );
          diff.percentDiff = percentDiff;

          // Allow small differences due to floating point
          if (percentDiff > 0.01) {
            compatible = false;
          }
        } else {
          compatible = false;
        }

        differences.push(diff);
      }
    }

    return { compatible, differences };
  }
}