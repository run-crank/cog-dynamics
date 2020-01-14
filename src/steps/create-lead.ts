/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, FieldDefinition, StepDefinition, RunStepResponse } from '../proto/cog_pb';
import { isNumber } from 'util';

export class CreateLead extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Dynamics CRM Lead';
  protected stepExpression: string = 'create a dynamics crm lead';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'lead',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();

    for (const key in stepData.lead) {
      if (!isNaN(stepData.lead[key])) {
        stepData.lead[key] = parseFloat(stepData.lead[key]);
      }
    }

    const request = {
      collection: 'leads',
      entity: stepData.lead,
      returnRepresentation: true,
    };
    try {
      const result = await this.client.create(request);
      return this.pass('Successfully created Lead with ID %s', [result['leadid']]);
    } catch (e) {
      return this.error('There was a problem creating the Lead: %s', [e.toString()]);
    }
  }

}

export { CreateLead as Step };
