/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, FieldDefinition, StepDefinition, RunStepResponse } from '../proto/cog_pb';

export class LeadFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Dynamics CRM Lead';
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on dynamics crm lead (?<email>.+) should be (?<expectedValue>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.STRING,
    description: "Lead's email address",
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const request = {
      collection: 'leads',
      select: ['emailaddress1', stepData.field],
      filter: `startswith(emailaddress1, '${stepData.email}')`,
      count: true,
    };

    try {
      const records = await this.client.retrieveMultiple(request);
      const result = records.find((lead: any) => lead['emailaddress1'] === stepData.email);
      // tslint:disable-next-line:triple-equals
      if (result[stepData.field] == stepData.expectedValue) {
        // tslint:disable-next-line:max-line-length
        return this.pass('The %s field was set to %s, as expected', [stepData.field, stepData.expectedValue]);
      } else {
        // tslint:disable-next-line:max-line-length
        return this.fail('Expected %s field to be %s, but it was actually %s', [stepData.field, stepData.expectedValue, result[stepData.field]]);
      }
    } catch (e) {
      return this.error('There was a problem checking the Lead: %s', [e.toString()]);
    }
  }

}

export { LeadFieldEquals as Step };
