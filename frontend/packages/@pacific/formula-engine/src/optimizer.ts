import { parse, simplify, MathNode } from 'mathjs';
import { FormulaParser } from './parser';

export interface OptimizationResult {
  originalExpression: string;
  optimizedExpression: string;
  improvements: string[];
  performanceGain?: number;
}

export class FormulaOptimizer {
  private parser: FormulaParser;

  constructor() {
    this.parser = new FormulaParser();
  }

  optimize(expression: string): OptimizationResult {
    const improvements: string[] = [];
    let optimized = expression;

    try {
      // Parse the expression
      const ast = parse(expression);

      // Apply simplification
      const simplified = simplify(ast);
      const simplifiedStr = simplified.toString();

      if (simplifiedStr !== expression && simplifiedStr.length < expression.length) {
        optimized = simplifiedStr;
        improvements.push('Applied algebraic simplification');
      }

      // Apply custom optimizations
      optimized = this.applyCustomOptimizations(optimized, improvements);

      // Cache common subexpressions
      optimized = this.cacheCommonSubexpressions(optimized, improvements);

      // Optimize conditional chains
      optimized = this.optimizeConditionals(optimized, improvements);

    } catch (error) {
      // If optimization fails, return original
      console.error('Optimization error:', error);
    }

    return {
      originalExpression: expression,
      optimizedExpression: optimized,
      improvements
    };
  }

  private applyCustomOptimizations(
    expression: string, 
    improvements: string[]
  ): string {
    let optimized = expression;

    // Replace division by multiplication where possible
    optimized = optimized.replace(/\/\s*(\d+)/g, (match, num) => {
      const divisor = parseFloat(num);
      if (divisor !== 0) {
        improvements.push(`Replaced division by ${divisor} with multiplication`);
        return ` * ${1 / divisor}`;
      }
      return match;
    });

    // Optimize power operations
    optimized = optimized.replace(/\^\s*2/g, (match) => {
      improvements.push('Replaced ^2 with multiplication');
      return ' * ';
    });

    // Remove redundant operations
    optimized = optimized.replace(/\+\s*0\b/g, '');
    optimized = optimized.replace(/\*\s*1\b/g, '');
    
    if (optimized !== expression) {
      improvements.push('Removed redundant operations');
    }

    return optimized;
  }

  private cacheCommonSubexpressions(
    expression: string,
    improvements: string[]
  ): string {
    // This is a simplified version - in production, you'd want more sophisticated CSE
    const subexpressions = new Map<string, number>();
    
    // Find repeated subexpressions
    const regex = /\([^()]+\)/g;
    let match;
    
    while ((match = regex.exec(expression)) !== null) {
      const subexpr = match[0];
      subexpressions.set(subexpr, (subexpressions.get(subexpr) || 0) + 1);
    }

    // For now, just note if there are repeated subexpressions
    const repeated = Array.from(subexpressions.entries())
      .filter(([_, count]) => count > 2);

    if (repeated.length > 0) {
      improvements.push(`Found ${repeated.length} repeated subexpressions that could be cached`);
    }

    return expression;
  }

  private optimizeConditionals(
    expression: string,
    improvements: string[]
  ): string {
    // Look for nested if statements that could be combined
    const nestedIfPattern = /if\s*\([^,]+,\s*if\s*\(/g;
    
    if (nestedIfPattern.test(expression)) {
      improvements.push('Found nested conditionals that could be optimized');
    }

    // Look for redundant condition checks
    const redundantPattern = /if\s*\(([^,]+),\s*([^,]+),\s*\2\)/g;
    
    expression = expression.replace(redundantPattern, '$2');
    if (expression.match(redundantPattern)) {
      improvements.push('Removed redundant conditional branches');
    }

    return expression;
  }

  // Analyze formula complexity and suggest improvements
  analyzeComplexity(expression: string): {
    complexity: number;
    suggestions: string[];
  } {
    const parseResult = this.parser.parse(expression);
    const suggestions: string[] = [];
    
    let complexity = 0;

    // Count operations
    const operationCount = (expression.match(/[+\-*/^]/g) || []).length;
    complexity += operationCount * 2;

    // Count function calls
    const functionCount = parseResult.functions.length;
    complexity += functionCount * 5;

    // Count variables
    const variableCount = parseResult.variables.length;
    complexity += variableCount;

    // Count conditionals
    const conditionalCount = (expression.match(/if\s*\(/g) || []).length;
    complexity += conditionalCount * 10;

    // Generate suggestions based on complexity
    if (operationCount > 10) {
      suggestions.push('Consider breaking down complex calculations into sub-formulas');
    }

    if (variableCount > 8) {
      suggestions.push('High number of variables - consider grouping related variables');
    }

    if (conditionalCount > 3) {
      suggestions.push('Multiple conditionals - consider using a lookup table or rules engine');
    }

    if (complexity > 50) {
      suggestions.push('High overall complexity - consider splitting into multiple formulas');
    }

    return { complexity, suggestions };
  }

  // Generate formula documentation
  generateDocumentation(expression: string): string {
    const parseResult = this.parser.parse(expression);
    
    let doc = '## Formula Documentation\n\n';
    doc += `**Expression:** \`${expression}\`\n\n`;
    
    if (parseResult.variables.length > 0) {
      doc += '### Variables Used:\n';
      parseResult.variables.forEach(v => {
        doc += `- \`${v}\`: [Description needed]\n`;
      });
      doc += '\n';
    }

    if (parseResult.functions.length > 0) {
      doc += '### Functions Used:\n';
      parseResult.functions.forEach(f => {
        doc += `- \`${f}\`: ${this.getFunctionDescription(f)}\n`;
      });
      doc += '\n';
    }

    const complexity = this.analyzeComplexity(expression);
    doc += `### Complexity Score: ${complexity.complexity}\n\n`;

    if (complexity.suggestions.length > 0) {
      doc += '### Optimization Suggestions:\n';
      complexity.suggestions.forEach(s => {
        doc += `- ${s}\n`;
      });
    }

    return doc;
  }

  private getFunctionDescription(fn: string): string {
    const descriptions: Record<string, string> = {
      'if': 'Conditional logic (if condition then A else B)',
      'max': 'Returns the maximum value',
      'min': 'Returns the minimum value',
      'sum': 'Calculates the sum of values',
      'mean': 'Calculates the average',
      'round': 'Rounds to nearest integer',
      'ceil': 'Rounds up to nearest integer',
      'floor': 'Rounds down to nearest integer',
      'abs': 'Returns absolute value',
      'sqrt': 'Square root',
      'pow': 'Power/exponentiation',
      'log': 'Natural logarithm',
      'exp': 'Exponential function'
    };

    return descriptions[fn] || 'Mathematical function';
  }
}