/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RunStepResponse, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import { isDate } from 'util';

export class DiscoverLead extends BaseStep implements StepInterface {

  protected stepName: string = 'Discover fields on a Dynamics CRM Lead';
  protected stepExpression: string = 'discover fields on dynamics crm lead (?<email>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Lead's email address",
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'lead',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'leadid',
      type: FieldDefinition.Type.NUMERIC,
      description: "Lead's Dynamics ID",
    }, {
      field: 'emailaddress1',
      type: FieldDefinition.Type.EMAIL,
      description: "Lead's Email Address",
    }, {
      field: 'fullname',
      type: FieldDefinition.Type.STRING,
      description: "Lead's Fullname",
    }, {
      field: 'createdon',
      type: FieldDefinition.Type.DATETIME,
      description: 'The date/time the Lead was created',
    }, {
      field: 'modifiedon',
      type: FieldDefinition.Type.DATETIME,
      description: 'The date/time the Lead was updated',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const request = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${stepData.email}')`,
      count: true,
    };

    try {
      const records = await this.client.retrieveMultiple(request);
      const lead = records ? records.find((lead: any) => lead['emailaddress1'] == email) : null;
      if (!lead) {
        return this.fail('No lead was found with email %s', [email]);
      } else {
        delete lead['@odata.etag'];
        const leadRecord = this.createRecord(lead);
        return this.pass('Successfully discovered fields on lead', [], [leadRecord]);
      }
    } catch (e) {
      return this.error('There was an error checking the lead: %s', [e.toString()]);
    }
  }

  public createRecord(lead): StepRecord {
    const obj = {};
    Object.keys(lead).forEach((key) => {
      obj[key] = isDate(lead[key]) ? lead[key].toISOString() : lead[key];
    });
    const record = this.keyValue('discoverLead', 'Discovered Lead', obj);
    return record;
  }

}

export { DiscoverLead as Step };
