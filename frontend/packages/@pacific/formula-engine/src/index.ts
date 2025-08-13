export * from './types';
export * from './parser';
export * from './executor';
export * from './validator';
export * from './optimizer';

// Main entry point
import { FormulaParser } from './parser';
import { FormulaExecutor } from './executor';
import { FormulaValidator } from './validator';
import { FormulaOptimizer } from './optimizer';
import { FormulaContext, FormulaResult } from './types';

export class FormulaEngine {
  private parser: FormulaParser;
  private executor: FormulaExecutor;
  private validator: FormulaValidator;
  private optimizer: FormulaOptimizer;

  constructor() {
    this.parser = new FormulaParser();
    this.executor = new FormulaExecutor();
    this.validator = new FormulaValidator();
    this.optimizer = new FormulaOptimizer();
  }

  async execute(expression: string, context: FormulaContext): Promise<FormulaResult> {
    return this.executor.execute(expression, context);
  }

  async validate(expression: string, context?: FormulaContext) {
    return this.validator.validateFormula(expression, context);
  }

  optimize(expression: string) {
    return this.optimizer.optimize(expression);
  }

  parse(expression: string) {
    return this.parser.parse(expression);
  }

  analyzeComplexity(expression: string) {
    return this.optimizer.analyzeComplexity(expression);
  }

  generateDocumentation(expression: string) {
    return this.optimizer.generateDocumentation(expression);
  }
}

// Export singleton instance for convenience
export const formulaEngine = new FormulaEngine();