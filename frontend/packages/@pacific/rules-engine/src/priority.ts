import { Rule } from './types';

export class RulePriorityManager {
  
  // Sort rules by priority (higher priority first)
  sortByPriority(rules: Rule[]): Rule[] {
    return [...rules].sort((a, b) => b.priority - a.priority);
  }

  // Group rules by type and priority
  groupRules(rules: Rule[]): Map<string, Rule[]> {
    const grouped = new Map<string, Rule[]>();

    rules.forEach(rule => {
      const key = rule.ruleType;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(rule);
    });

    // Sort each group by priority
    grouped.forEach((ruleList, key) => {
      grouped.set(key, this.sortByPriority(ruleList));
    });

    return grouped;
  }

  // Detect potential conflicts between rules
  detectConflicts(rules: Rule[]): Array<{
    rule1: Rule;
    rule2: Rule;
    type: 'priority' | 'condition' | 'action';
    description: string;
  }> {
    const conflicts: Array<any> = [];

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i];
        const rule2 = rules[j];

        // Check for same priority
        if (rule1.priority === rule2.priority && rule1.ruleType === rule2.ruleType) {
          conflicts.push({
            rule1,
            rule2,
            type: 'priority',
            description: `Rules have same priority (${rule1.priority}) and type (${rule1.ruleType})`
          });
        }

        // Check for conflicting actions on same targets
        const conflictingActions = this.findConflictingActions(rule1, rule2);
        if (conflictingActions.length > 0) {
          conflicts.push({
            rule1,
            rule2,
            type: 'action',
            description: `Rules have conflicting actions: ${conflictingActions.join(', ')}`
          });
        }
      }
    }

    return conflicts;
  }

  private findConflictingActions(rule1: Rule, rule2: Rule): string[] {
    const conflicts: string[] = [];

    // Get setValue targets from both rules
    const targets1 = rule1.actions
      .filter(a => a.type === 'setValue' && a.target)
      .map(a => a.target!);
    
    const targets2 = rule2.actions
      .filter(a => a.type === 'setValue' && a.target)
      .map(a => a.target!);

    // Find overlapping targets
    const overlapping = targets1.filter(t => targets2.includes(t));
    
    if (overlapping.length > 0) {
      conflicts.push(...overlapping.map(t => `both rules set "${t}"`));
    }

    return conflicts;
  }

  // Optimize rule execution order
  optimizeExecutionOrder(rules: Rule[]): Rule[] {
    // Group by type
    const grouped = this.groupRules(rules);
    
    // Execute in this order: triggers -> modifiers -> thresholds
    const executionOrder: Rule[] = [];
    
    const typeOrder = ['trigger', 'modifier', 'threshold'];
    typeOrder.forEach(type => {
      if (grouped.has(type)) {
        executionOrder.push(...grouped.get(type)!);
      }
    });

    // Add any other types
    grouped.forEach((ruleList, type) => {
      if (!typeOrder.includes(type)) {
        executionOrder.push(...ruleList);
      }
    });

    return executionOrder;
  }

  // Calculate effective priority based on multiple factors
  calculateEffectivePriority(rule: Rule, context?: {
    executionHistory?: Map<string, number>;
    currentLoad?: number;
  }): number {
    let effectivePriority = rule.priority;

    // Boost priority for triggers
    if (rule.ruleType === 'trigger') {
      effectivePriority *= 1.5;
    }

    // Consider execution history (reduce priority if recently executed)
    if (context?.executionHistory?.has(rule.id)) {
      const lastExecution = context.executionHistory.get(rule.id)!;
      const timeSinceExecution = Date.now() - lastExecution;
      const cooldownPeriod = 60000; // 1 minute

      if (timeSinceExecution < cooldownPeriod) {
        effectivePriority *= 0.5;
      }
    }

    // Consider system load
    if (context?.currentLoad && context.currentLoad > 0.8) {
      // Reduce priority of non-critical rules under high load
      if (rule.priority < 50) {
        effectivePriority *= 0.7;
      }
    }

    return Math.round(effectivePriority);
  }

  // Get execution plan for a set of rules
  getExecutionPlan(rules: Rule[], options?: {
    maxConcurrent?: number;
    respectDependencies?: boolean;
  }): Array<{
    phase: number;
    rules: Rule[];
  }> {
    const maxConcurrent = options?.maxConcurrent || 10;
    const sorted = this.optimizeExecutionOrder(rules);
    const phases: Array<{ phase: number; rules: Rule[] }> = [];

    // Simple batching for now
    let currentPhase = 0;
    let currentBatch: Rule[] = [];

    sorted.forEach(rule => {
      currentBatch.push(rule);

      if (currentBatch.length >= maxConcurrent) {
        phases.push({
          phase: currentPhase++,
          rules: [...currentBatch]
        });
        currentBatch = [];
      }
    });

    // Add remaining rules
    if (currentBatch.length > 0) {
      phases.push({
        phase: currentPhase,
        rules: currentBatch
      });
    }

    return phases;
  }
}