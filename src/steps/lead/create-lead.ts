/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RunStepResponse, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import { isDate } from 'util';
import * as moment from 'moment';

export class CreateLead extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Dynamics CRM Lead';
  protected stepExpression: string = 'create a dynamics crm lead';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'lead',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
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
    const dateTokenFormat = /^\d{4}-\d{2}-\d{2}(?:.?\d{2}:\d{2}:\d{2})?(?:\.\d{3}.?)?$/;
    for (const key in stepData.lead) {
      if (!isNaN(stepData.lead[key])) {
        stepData.lead[key] = parseFloat(stepData.lead[key]);
      } else if (dateTokenFormat.test(stepData.lead[key])) {
        stepData.lead[key] = stepData.lead[key].includes('00:00:00') ? moment(stepData.lead[key]).format('YYYY-MM-DD') : stepData.lead[key];
      }
    }

    const request = {
      collection: 'leads',
      entity: stepData.lead,
      returnRepresentation: true,
    };
    try {
      const result = await this.client.create(request);

      delete result['@odata.etag'];
      const leadRecord = this.createRecord(result);
      return this.pass('Successfully created Lead with ID %s', [result['leadid']], [leadRecord]);
    } catch (e) {
      return this.error('There was a problem creating the Lead: %s', [e.toString()]);
    }
  }

  public createRecord(lead): StepRecord {
    const obj = {};
    Object.keys(lead).forEach((key) => {
      obj[key] = isDate(lead[key]) ? lead[key].toISOString() : lead[key];
    });
    const record = this.keyValue('lead', 'Created Lead', obj);
    return record;
  }

}

export { CreateLead as Step };
