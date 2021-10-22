/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RunStepResponse } from '../../proto/cog_pb';

export class DeleteContact extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Dynamics CRM Contact';
  protected stepExpression: string = 'delete the (?<email>.+) dynamics crm contact';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Contact's email address",
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const retrieveRequest = {
      collection: 'contacts',
      select: ['emailaddress1'],
      count: true,
    };

    try {
      const records = await this.client.retrieveMultiple(retrieveRequest);
      // tslint:disable-next-line:triple-equals
      const contact = records.find((contact: any) => contact['emailaddress1'] == email);
      if (contact) {
        const deleteRequest = {
          key: contact.contactid,
          collection: 'contacts',
        };
        const result = await this.client.delete(deleteRequest, email);
        return this.pass('Successfully deleted Contact %s', [email]);
      } else {
        return this.fail('Contact %s does not exist', [email]);
      }
    } catch (e) {
      return this.error('There was a problem deleting the Contact: %s', [e.toString()]);
    }
  }

}

export { DeleteContact as Step };
