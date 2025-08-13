export interface RuleCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 
            'greaterThanOrEqual' | 'lessThanOrEqual' | 'contains' | 
            'notContains' | 'in' | 'notIn' | 'between' | 'regex';
  value: any;
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'array';
}

export interface RuleConditionGroup {
  operator: 'and' | 'or';
  conditions: (RuleCondition | RuleConditionGroup)[];
}

export interface RuleAction {
  type: 'setValue' | 'calculate' | 'alert' | 'log' | 'webhook' | 'custom';
  target?: string;
  value?: any;
  formula?: string;
  message?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  customHandler?: string;
}

export interface Rule {
  id: string;
  name: string;
  ruleType: 'trigger' | 'threshold' | 'modifier';
  conditions: RuleConditionGroup;
  actions: RuleAction[];
  priority: number;
  isActive: boolean;
  description?: string;
  metadata?: Record<string, any>;
}

export interface RuleEvaluationContext {
  data: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  executionTime: number;
  actionsExecuted: ActionExecutionResult[];
  errors?: string[];
}

export interface ActionExecutionResult {
  actionType: string;
  success: boolean;
  result?: any;
  error?: string;
}

export interface RuleSetEvaluationResult {
  evaluatedRules: number;
  matchedRules: number;
  totalExecutionTime: number;
  results: RuleEvaluationResult[];
  aggregatedActions: Record<string, any>;
}