/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RunStepResponse, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import { isDate } from 'util';

export class DiscoverContact extends BaseStep implements StepInterface {

  protected stepName: string = 'Discover fields on a Dynamics CRM Contact';
  protected stepExpression: string = 'discover fields on dynamics crm contact (?<email>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Contact's email address",
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'contact',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'contactid',
      type: FieldDefinition.Type.NUMERIC,
      description: "Contact's Dynamics ID",
    }, {
      field: 'emailaddress1',
      type: FieldDefinition.Type.EMAIL,
      description: "Contact's Email Address",
    }, {
      field: 'fullname',
      type: FieldDefinition.Type.STRING,
      description: "Contact's Fullname",
    }, {
      field: 'createdon',
      type: FieldDefinition.Type.DATETIME,
      description: 'The date/time the Contact was created',
    }, {
      field: 'modifiedon',
      type: FieldDefinition.Type.DATETIME,
      description: 'The date/time the Contact was updated',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const request = {
      collection: 'contacts',
      filter: `startswith(emailaddress1, '${stepData.email}')`,
      count: true,
    };

    try {
      const records = await this.client.retrieveMultiple(request);
      const contact = records ? records.find((contact: any) => contact['emailaddress1'] == email) : null;
      if (!contact) {
        return this.fail('No contact was found with email %s', [email]);
      } else {
        delete contact['@odata.etag'];
        let contactRecord = this.createRecord(contact);
        return this.pass('Successfully discovered fields on contact', [], [contactRecord]);
      }
    } catch (e) {
      return this.error('There was an error checking the contact: %s', [e.toString()]);
    }
  }

  public createRecord(contact): StepRecord {
    const obj = {};
    Object.keys(contact).forEach((key) => {
      obj[key] = isDate(contact[key]) ? contact[key].toISOString() : contact[key];
    });
    const record = this.keyValue('discoverContact', 'Discovered Contact', obj);
    return record;
  }

}

export { DiscoverContact as Step };
