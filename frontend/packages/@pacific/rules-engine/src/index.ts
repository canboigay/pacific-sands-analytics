export * from './types';
export * from './evaluator';
export * from './actions';
export * from './priority';

import { RuleEvaluator } from './evaluator';
import { ActionExecutor } from './actions';
import { RulePriorityManager } from './priority';
import { 
  Rule, 
  RuleEvaluationContext, 
  RuleEvaluationResult,
  RuleSetEvaluationResult
} from './types';

export class RulesEngine {
  private evaluator: RuleEvaluator;
  private actionExecutor: ActionExecutor;
  private priorityManager: RulePriorityManager;

  constructor() {
    this.evaluator = new RuleEvaluator();
    this.actionExecutor = new ActionExecutor();
    this.priorityManager = new RulePriorityManager();
  }

  async evaluateRules(
    rules: Rule[],
    context: RuleEvaluationContext,
    options?: {
      stopOnFirstMatch?: boolean;
      executeActions?: boolean;
      parallel?: boolean;
    }
  ): Promise<RuleSetEvaluationResult> {
    const startTime = performance.now();
    const results: RuleEvaluationResult[] = [];
    const aggregatedActions: Record<string, any> = {};

    // Filter active rules and sort by priority
    const activeRules = rules.filter(r => r.isActive);
    const sortedRules = this.priorityManager.sortByPriority(activeRules);

    // Track modified data across rule executions
    const modifiedData = { ...context.data };
    const modifiedContext = { ...context, data: modifiedData };

    for (const rule of sortedRules) {
      const ruleResult = await this.evaluateRule(rule, modifiedContext, {
        executeActions: options?.executeActions !== false
      });

      results.push(ruleResult);

      // Aggregate actions by type
      ruleResult.actionsExecuted.forEach(action => {
        if (action.success && action.result) {
          const key = action.actionType;
          if (!aggregatedActions[key]) {
            aggregatedActions[key] = [];
          }
          aggregatedActions[key].push(action.result);
        }
      });

      // Stop if requested and rule matched
      if (options?.stopOnFirstMatch && ruleResult.matched) {
        break;
      }
    }

    const totalExecutionTime = performance.now() - startTime;

    return {
      evaluatedRules: results.length,
      matchedRules: results.filter(r => r.matched).length,
      totalExecutionTime,
      results,
      aggregatedActions
    };
  }

  async evaluateRule(
    rule: Rule,
    context: RuleEvaluationContext,
    options?: {
      executeActions?: boolean;
    }
  ): Promise<RuleEvaluationResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    let matched = false;
    const actionsExecuted = [];

    try {
      // Evaluate conditions
      matched = this.evaluator.evaluateRule(rule, context);

      // Execute actions if rule matches and execution is enabled
      if (matched && options?.executeActions !== false) {
        for (const action of rule.actions) {
          const actionResult = await this.actionExecutor.executeAction(
            action,
            context
          );
          actionsExecuted.push(actionResult);

          if (!actionResult.success && actionResult.error) {
            errors.push(actionResult.error);
          }
        }
      }

    } catch (error: any) {
      errors.push(`Rule evaluation error: ${error.message}`);
    }

    const executionTime = performance.now() - startTime;

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched,
      executionTime,
      actionsExecuted,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // Validate a set of rules
  validateRuleSet(rules: Rule[]): {
    valid: boolean;
    errors: Array<{ ruleId: string; errors: string[] }>;
    warnings: Array<{ type: string; message: string }>;
  } {
    const ruleErrors: Array<{ ruleId: string; errors: string[] }> = [];
    const warnings: Array<{ type: string; message: string }> = [];

    // Validate individual rules
    rules.forEach(rule => {
      const validation = this.evaluator.validateRule(rule);
      if (!validation.isValid) {
        ruleErrors.push({
          ruleId: rule.id,
          errors: validation.errors
        });
      }
    });

    // Check for conflicts
    const conflicts = this.priorityManager.detectConflicts(rules);
    conflicts.forEach(conflict => {
      warnings.push({
        type: 'conflict',
        message: `${conflict.rule1.name} and ${conflict.rule2.name}: ${conflict.description}`
      });
    });

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(rules);
    if (circularDeps.length > 0) {
      warnings.push({
        type: 'circular',
        message: `Circular dependencies detected: ${circularDeps.join(' -> ')}`
      });
    }

    return {
      valid: ruleErrors.length === 0,
      errors: ruleErrors,
      warnings
    };
  }

  private detectCircularDependencies(rules: Rule[]): string[] {
    // Simple detection - check if rules modify fields that other rules depend on
    const dependencies = new Map<string, Set<string>>();

    rules.forEach(rule => {
      const ruleId = rule.id;
      const referencedFields = this.evaluator.getReferencedFields(rule);
      
      // Find which fields this rule modifies
      const modifiedFields = rule.actions
        .filter(a => a.type === 'setValue' && a.target)
        .map(a => a.target!);

      // Check if any other rule depends on these modified fields
      rules.forEach(otherRule => {
        if (otherRule.id !== ruleId) {
          const otherFields = this.evaluator.getReferencedFields(otherRule);
          const overlap = modifiedFields.filter(f => otherFields.includes(f));
          
          if (overlap.length > 0) {
            if (!dependencies.has(ruleId)) {
              dependencies.set(ruleId, new Set());
            }
            dependencies.get(ruleId)!.add(otherRule.id);
          }
        }
      });
    });

    // Detect cycles (simplified - just check for direct cycles)
    const cycles: string[] = [];
    dependencies.forEach((deps, ruleId) => {
      deps.forEach(depId => {
        if (dependencies.has(depId) && dependencies.get(depId)!.has(ruleId)) {
          cycles.push(`${ruleId} <-> ${depId}`);
        }
      });
    });

    return cycles;
  }

  // Register custom action handler
  registerActionHandler(name: string, handler: Function) {
    this.actionExecutor.registerCustomHandler(name, handler);
  }

  // Get rule execution plan
  getExecutionPlan(rules: Rule[], options?: any) {
    return this.priorityManager.getExecutionPlan(rules, options);
  }
}

// Export singleton instance
export const rulesEngine = new RulesEngine();