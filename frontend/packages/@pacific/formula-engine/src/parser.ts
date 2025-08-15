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
        const symbolNode = node as any;
        if (!result.variables.includes(symbolNode.name)) {
          result.variables.push(symbolNode.name);
        }
        break;

      case 'FunctionNode':
        const functionNode = node as any;
        if (!result.functions.includes(functionNode.fn.name)) {
          result.functions.push(functionNode.fn.name);
        }
        functionNode.args.forEach((arg: any) => this.traverseNode(arg, result));
        break;

      case 'OperatorNode':
        const operatorNode = node as any;
        operatorNode.args.forEach((arg: any) => this.traverseNode(arg, result));
        break;

      case 'ConditionalNode':
        const conditionalNode = node as any;
        this.traverseNode(conditionalNode.condition, result);
        this.traverseNode(conditionalNode.trueExpr, result);
        this.traverseNode(conditionalNode.falseExpr, result);
        break;

      case 'ArrayNode':
      case 'ObjectNode':
        const arrayOrObjectNode = node as any;
        if ('items' in arrayOrObjectNode) {
          arrayOrObjectNode.items.forEach((item: any) => this.traverseNode(item, result));
        }
        break;

      case 'AccessorNode':
        const accessorNode = node as any;
        this.traverseNode(accessorNode.object, result);
        if ('index' in accessorNode) {
          this.traverseNode(accessorNode.index, result);
        }
        break;

      case 'IndexNode':
        const indexNode = node as any;
        this.traverseNode(indexNode.object, result);
        indexNode.dimensions.forEach((dim: any) => this.traverseNode(dim, result));
        break;

      case 'RangeNode':
        const rangeNode = node as any;
        if (rangeNode.start) this.traverseNode(rangeNode.start, result);
        if (rangeNode.end) this.traverseNode(rangeNode.end, result);
        if (rangeNode.step) this.traverseNode(rangeNode.step, result);
        break;

      case 'AssignmentNode':
        const assignmentNode = node as any;
        this.traverseNode(assignmentNode.value, result);
        break;

      case 'BlockNode':
        const blockNode = node as any;
        blockNode.blocks.forEach((block: any) => {
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
      const anyNode = n as any;
      if (n.type === 'FunctionNode' && anyNode.fn && anyNode.fn.name === 'if') {
        const newDepth = d + 1;
        maxDepth = Math.max(maxDepth, newDepth);
        anyNode.args.forEach((arg: any) => traverse(arg, newDepth));
      } else if ('args' in anyNode && Array.isArray(anyNode.args)) {
        anyNode.args.forEach((arg: any) => traverse(arg, d));
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