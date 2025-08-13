import { 
  Rule, 
  RuleCondition, 
  RuleConditionGroup, 
  RuleEvaluationContext,
  RuleEvaluationResult
} from './types';
import { get, isEqual } from 'lodash';

export class RuleEvaluator {
  
  evaluateRule(rule: Rule, context: RuleEvaluationContext): boolean {
    try {
      return this.evaluateConditionGroup(rule.conditions, context);
    } catch (error) {
      console.error(`Error evaluating rule ${rule.name}:`, error);
      return false;
    }
  }

  private evaluateConditionGroup(
    group: RuleConditionGroup, 
    context: RuleEvaluationContext
  ): boolean {
    const results = group.conditions.map(condition => {
      if ('operator' in condition && 'conditions' in condition) {
        // It's a nested group
        return this.evaluateConditionGroup(condition as RuleConditionGroup, context);
      } else {
        // It's a simple condition
        return this.evaluateCondition(condition as RuleCondition, context);
      }
    });

    if (group.operator === 'and') {
      return results.every(r => r === true);
    } else {
      return results.some(r => r === true);
    }
  }

  private evaluateCondition(
    condition: RuleCondition, 
    context: RuleEvaluationContext
  ): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return isEqual(fieldValue, conditionValue);
      
      case 'notEquals':
        return !isEqual(fieldValue, conditionValue);
      
      case 'greaterThan':
        return this.compareNumeric(fieldValue) > this.compareNumeric(conditionValue);
      
      case 'lessThan':
        return this.compareNumeric(fieldValue) < this.compareNumeric(conditionValue);
      
      case 'greaterThanOrEqual':
        return this.compareNumeric(fieldValue) >= this.compareNumeric(conditionValue);
      
      case 'lessThanOrEqual':
        return this.compareNumeric(fieldValue) <= this.compareNumeric(conditionValue);
      
      case 'contains':
        return String(fieldValue).includes(String(conditionValue));
      
      case 'notContains':
        return !String(fieldValue).includes(String(conditionValue));
      
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      
      case 'notIn':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      
      case 'between':
        if (Array.isArray(conditionValue) && conditionValue.length === 2) {
          const numValue = this.compareNumeric(fieldValue);
          return numValue >= this.compareNumeric(conditionValue[0]) && 
                 numValue <= this.compareNumeric(conditionValue[1]);
        }
        return false;
      
      case 'regex':
        try {
          const regex = new RegExp(String(conditionValue));
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }
      
      default:
        console.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  private getFieldValue(field: string, context: RuleEvaluationContext): any {
    // Support nested field access with dot notation
    return get(context.data, field);
  }

  private compareNumeric(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    if (value instanceof Date) return value.getTime();
    return 0;
  }

  // Validate rule structure
  validateRule(rule: Rule): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.id) errors.push('Rule must have an ID');
    if (!rule.name) errors.push('Rule must have a name');
    if (!rule.conditions) errors.push('Rule must have conditions');
    if (!rule.actions || rule.actions.length === 0) {
      errors.push('Rule must have at least one action');
    }

    // Validate condition structure
    if (rule.conditions) {
      this.validateConditionGroup(rule.conditions, errors);
    }

    // Validate actions
    if (rule.actions) {
      rule.actions.forEach((action, index) => {
        if (!action.type) {
          errors.push(`Action ${index} must have a type`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateConditionGroup(
    group: RuleConditionGroup, 
    errors: string[]
  ): void {
    if (!group.operator || !['and', 'or'].includes(group.operator)) {
      errors.push('Condition group must have operator "and" or "or"');
    }

    if (!Array.isArray(group.conditions) || group.conditions.length === 0) {
      errors.push('Condition group must have at least one condition');
    }

    group.conditions?.forEach(condition => {
      if ('operator' in condition && 'conditions' in condition) {
        this.validateConditionGroup(condition as RuleConditionGroup, errors);
      } else {
        this.validateCondition(condition as RuleCondition, errors);
      }
    });
  }

  private validateCondition(condition: RuleCondition, errors: string[]): void {
    if (!condition.field) errors.push('Condition must have a field');
    if (!condition.operator) errors.push('Condition must have an operator');
    if (condition.value === undefined) errors.push('Condition must have a value');
  }

  // Get all fields referenced in a rule
  getReferencedFields(rule: Rule): string[] {
    const fields = new Set<string>();
    this.collectFieldsFromGroup(rule.conditions, fields);
    return Array.from(fields);
  }

  private collectFieldsFromGroup(
    group: RuleConditionGroup, 
    fields: Set<string>
  ): void {
    group.conditions.forEach(condition => {
      if ('operator' in condition && 'conditions' in condition) {
        this.collectFieldsFromGroup(condition as RuleConditionGroup, fields);
      } else {
        fields.add((condition as RuleCondition).field);
      }
    });
  }
}