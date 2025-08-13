import { parse, MathNode } from 'mathjs';
import { FormulaParseResult, FormulaValidation } from './types';

export class FormulaParser {
  private allowedFunctions = [
    'add', 'subtract', 'multiply', 'divide', 'mod', 'pow', 'sqrt',
    'abs', 'ceil', 'floor', 'round', 'min', 'max', 'mean', 'median',
    'sum', 'prod', 'std', 'variance', 'if', 'and', 'or', 'not',
    'equal', 'unequal', 'smaller', 'larger', 'smallerEq', 'largerEq',
    'log', 'log10', 'exp', 'sin', 'cos', 'tan'
  ];

  parse(expression: string): FormulaParseResult {
    const result: FormulaParseResult = {
      ast: null,
      variables: [],
      functions: [],
      isValid: false,
      errors: []
    };

    try {
      // Parse the expression
      const ast = parse(expression);
      result.ast = ast;

      // Extract variables and functions
      this.traverseNode(ast, result);

      // Check for disallowed functions
      const disallowedFunctions = result.functions.filter(
        fn => !this.allowedFunctions.includes(fn)
      );

      if (disallowedFunctions.length > 0) {
        result.errors.push(
          `Disallowed functions: ${disallowedFunctions.join(', ')}`
        );
      } else {
        result.isValid = true;
      }

    } catch (error: any) {
      result.errors.push(`Parse error: ${error.message}`);
    }

    return result;
  }

  validate(expression: string): FormulaValidation {
    const parseResult = this.parse(expression);
    
    const validation: FormulaValidation = {
      isValid: parseResult.isValid,
      errors: parseResult.errors,
      warnings: [],
      usedVariables: parseResult.variables,
      estimatedComplexity: this.estimateComplexity(parseResult)
    };

    // Add warnings for common issues
    if (parseResult.variables.length > 10) {
      validation.warnings.push('Formula uses many variables, consider simplifying');
    }

    if (parseResult.functions.includes('if') && this.countNestedIfs(parseResult.ast) > 3) {
      validation.warnings.push('Complex nested conditions detected');
    }

    return validation;
  }

  private traverseNode(node: MathNode, result: FormulaParseResult) {
    switch (node.type) {
      case 'SymbolNode':
        if (!result.variables.includes(node.name)) {
          result.variables.push(node.name);
        }
        break;

      case 'FunctionNode':
        if (!result.functions.includes(node.fn.name)) {
          result.functions.push(node.fn.name);
        }
        node.args.forEach(arg => this.traverseNode(arg, result));
        break;

      case 'OperatorNode':
        node.args.forEach(arg => this.traverseNode(arg, result));
        break;

      case 'ConditionalNode':
        this.traverseNode(node.condition, result);
        this.traverseNode(node.trueExpr, result);
        this.traverseNode(node.falseExpr, result);
        break;

      case 'ArrayNode':
      case 'ObjectNode':
        if ('items' in node) {
          node.items.forEach(item => this.traverseNode(item, result));
        }
        break;

      case 'AccessorNode':
        this.traverseNode(node.object, result);
        if ('index' in node) {
          this.traverseNode(node.index, result);
        }
        break;

      case 'IndexNode':
        this.traverseNode(node.object, result);
        node.dimensions.forEach(dim => this.traverseNode(dim, result));
        break;

      case 'RangeNode':
        if (node.start) this.traverseNode(node.start, result);
        if (node.end) this.traverseNode(node.end, result);
        if (node.step) this.traverseNode(node.step, result);
        break;

      case 'AssignmentNode':
        this.traverseNode(node.value, result);
        break;

      case 'BlockNode':
        node.blocks.forEach(block => {
          if ('node' in block) {
            this.traverseNode(block.node, result);
          }
        });
        break;

      case 'ConstantNode':
      case 'ParenthesisNode':
        // These don't need special handling
        break;
    }
  }

  private countNestedIfs(node: MathNode, depth: number = 0): number {
    let maxDepth = depth;

    const traverse = (n: MathNode, d: number) => {
      if (n.type === 'FunctionNode' && n.fn.name === 'if') {
        const newDepth = d + 1;
        maxDepth = Math.max(maxDepth, newDepth);
        n.args.forEach(arg => traverse(arg, newDepth));
      } else if ('args' in n && Array.isArray(n.args)) {
        n.args.forEach(arg => traverse(arg, d));
      }
    };

    traverse(node, depth);
    return maxDepth;
  }

  private estimateComplexity(parseResult: FormulaParseResult): 'low' | 'medium' | 'high' {
    const variableCount = parseResult.variables.length;
    const functionCount = parseResult.functions.length;
    const hasConditionals = parseResult.functions.some(fn => 
      ['if', 'and', 'or'].includes(fn)
    );

    if (variableCount > 8 || functionCount > 5 || 
        (hasConditionals && functionCount > 3)) {
      return 'high';
    } else if (variableCount > 4 || functionCount > 2 || hasConditionals) {
      return 'medium';
    }

    return 'low';
  }
}