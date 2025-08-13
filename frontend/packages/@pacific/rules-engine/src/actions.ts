import { 
  RuleAction, 
  ActionExecutionResult, 
  RuleEvaluationContext 
} from './types';
import { FormulaEngine } from '@pacific/formula-engine';
import { set } from 'lodash';

export class ActionExecutor {
  private formulaEngine: FormulaEngine;
  private customHandlers: Map<string, Function>;

  constructor() {
    this.formulaEngine = new FormulaEngine();
    this.customHandlers = new Map();
  }

  async executeAction(
    action: RuleAction, 
    context: RuleEvaluationContext,
    modifiedData?: Record<string, any>
  ): Promise<ActionExecutionResult> {
    const startTime = performance.now();
    
    try {
      let result: any;

      switch (action.type) {
        case 'setValue':
          result = await this.executeSetValue(action, context, modifiedData);
          break;

        case 'calculate':
          result = await this.executeCalculate(action, context);
          break;

        case 'alert':
          result = await this.executeAlert(action, context);
          break;

        case 'log':
          result = await this.executeLog(action, context);
          break;

        case 'webhook':
          result = await this.executeWebhook(action, context);
          break;

        case 'custom':
          result = await this.executeCustom(action, context);
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      return {
        actionType: action.type,
        success: true,
        result
      };

    } catch (error: any) {
      return {
        actionType: action.type,
        success: false,
        error: error.message
      };
    }
  }

  private async executeSetValue(
    action: RuleAction,
    context: RuleEvaluationContext,
    modifiedData?: Record<string, any>
  ): Promise<any> {
    if (!action.target) {
      throw new Error('setValue action requires a target field');
    }

    const targetData = modifiedData || context.data;
    set(targetData, action.target, action.value);
    
    return {
      field: action.target,
      value: action.value
    };
  }

  private async executeCalculate(
    action: RuleAction,
    context: RuleEvaluationContext
  ): Promise<any> {
    if (!action.formula) {
      throw new Error('calculate action requires a formula');
    }

    const result = await this.formulaEngine.execute(action.formula, {
      variables: context.data,
      metadata: context.metadata
    });

    if (result.errors && result.errors.length > 0) {
      throw new Error(`Formula execution failed: ${result.errors.join(', ')}`);
    }

    // If target is specified, set the calculated value
    if (action.target) {
      set(context.data, action.target, result.value);
    }

    return {
      formula: action.formula,
      result: result.value,
      executionTime: result.executionTime
    };
  }

  private async executeAlert(
    action: RuleAction,
    context: RuleEvaluationContext
  ): Promise<any> {
    const message = this.interpolateMessage(
      action.message || 'Rule triggered', 
      context
    );

    // In a real implementation, this would send to a notification service
    console.warn(`[ALERT] ${message}`);

    return {
      message,
      timestamp: new Date().toISOString()
    };
  }

  private async executeLog(
    action: RuleAction,
    context: RuleEvaluationContext
  ): Promise<any> {
    const message = this.interpolateMessage(
      action.message || 'Rule executed', 
      context
    );

    // In a real implementation, this would use a proper logging service
    console.log(`[RULE LOG] ${message}`);

    return {
      message,
      timestamp: new Date().toISOString()
    };
  }

  private async executeWebhook(
    action: RuleAction,
    context: RuleEvaluationContext
  ): Promise<any> {
    if (!action.url) {
      throw new Error('webhook action requires a URL');
    }

    const body = {
      ruleAction: action,
      context: {
        data: context.data,
        metadata: context.metadata,
        timestamp: context.timestamp || new Date()
      }
    };

    try {
      const response = await fetch(action.url, {
        method: action.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...action.headers
        },
        body: JSON.stringify(body)
      });

      return {
        url: action.url,
        status: response.status,
        success: response.ok
      };

    } catch (error: any) {
      throw new Error(`Webhook failed: ${error.message}`);
    }
  }

  private async executeCustom(
    action: RuleAction,
    context: RuleEvaluationContext
  ): Promise<any> {
    if (!action.customHandler) {
      throw new Error('custom action requires a handler name');
    }

    const handler = this.customHandlers.get(action.customHandler);
    if (!handler) {
      throw new Error(`Custom handler not found: ${action.customHandler}`);
    }

    return await handler(action, context);
  }

  // Register custom action handlers
  registerCustomHandler(name: string, handler: Function) {
    this.customHandlers.set(name, handler);
  }

  // Interpolate variables in messages
  private interpolateMessage(
    template: string, 
    context: RuleEvaluationContext
  ): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.getValueFromPath(key.trim(), context.data);
      return value !== undefined ? String(value) : match;
    });
  }

  private getValueFromPath(path: string, data: any): any {
    return path.split('.').reduce((acc, part) => acc?.[part], data);
  }

  // Validate action configuration
  validateAction(action: RuleAction): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!action.type) {
      errors.push('Action must have a type');
    }

    switch (action.type) {
      case 'setValue':
        if (!action.target) errors.push('setValue requires target field');
        if (action.value === undefined) errors.push('setValue requires value');
        break;

      case 'calculate':
        if (!action.formula) errors.push('calculate requires formula');
        break;

      case 'webhook':
        if (!action.url) errors.push('webhook requires URL');
        if (action.url && !this.isValidUrl(action.url)) {
          errors.push('Invalid webhook URL');
        }
        break;

      case 'custom':
        if (!action.customHandler) errors.push('custom requires handler name');
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}