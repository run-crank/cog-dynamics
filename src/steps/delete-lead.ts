/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, FieldDefinition, StepDefinition, RunStepResponse } from '../proto/cog_pb';

export class DeleteLead extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Dynamics CRM Lead';
  protected stepExpression: string = 'delete the dynamics contact (?<email>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.STRING,
    description: 'Lead Email String',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const retriveRequest = {
      collection: 'leads',
      select: ['emailaddress1'],
      count: true,
    };

    try {
      const records = await this.client.retrieveMultiple(retriveRequest);
      // tslint:disable-next-line:triple-equals
      const lead = records.find((lead: any) => lead['emailaddress1'] == stepData.email);
      if (lead) {
        const deleteRequest = {
          key: lead.leadid,
          collection: 'leads',
        };
        const result = await this.client.delete(deleteRequest);
        if (result) {
          return this.pass('Successfully deleted Lead %s', [stepData.email]);
        } else {
          return this.fail('Failed to delete Lead %s', [stepData.email]);
        }
      } else {
        return this.error('Lead %s does not exist', [stepData.email]);
      }
    } catch (e) {
      return this.error('There was a problem deleting the Lead: %s', [e.toString()]);
    }
  }

}

export { DeleteLead as Step };
