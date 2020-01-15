/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, FieldDefinition, StepDefinition, RunStepResponse } from '../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../client/constants/operators';
import { isDate } from 'util';

export class LeadFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Dynamics CRM Lead';
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on dynamics crm lead (?<email>.+) should (?<operator>be less than|be greater than|be|contain|not be|not contain) (?<expectedValue>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Lead's email address",
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, or be less than)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const field: string = stepData.field;
    const operator: string = stepData.operator || 'be';
    const expectedValue: string = stepData.expectedValue;
    const request = {
      collection: 'leads',
      select: ['emailaddress1', stepData.field],
      filter: `startswith(emailaddress1, '${stepData.email}')`,
      count: true,
    };
    let actualValue;

    try {
      const records = await this.client.retrieveMultiple(request);
      const result = records.find((lead: any) => lead['emailaddress1'] === email);

      if (!result) {
        return this.error('No Lead was found with email %s', [email]);
      } else {
        actualValue = result[field];
        if (isDate(result[field])) {
          actualValue = result[field].toISOString();
        }
      }

      if (this.compare(operator, actualValue, expectedValue)) {
        return this.pass(this.operatorSuccessMessages[operator], [field, expectedValue]);
      } else {
        return this.fail(this.operatorFailMessages[operator], [
          field,
          expectedValue,
          actualValue,
        ]);
      }
    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error('There was an error checking the lead field: %s', [e.message]);
      }
      return this.error('There was an checking the lead field: %s', [e.toString()]);
    }
  }

}

export { LeadFieldEquals as Step };
