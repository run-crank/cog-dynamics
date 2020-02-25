/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../core/base-step';
import { Step, FieldDefinition, StepDefinition, RunStepResponse, RecordDefinition, StepRecord } from '../proto/cog_pb';
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
    const email: string = stepData.email;
    const field: string = stepData.field;
    const operator: string = stepData.operator || 'be';
    const expectedValue: string = stepData.expectedValue;
    const request = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${stepData.email}')`,
      count: true,
    };
    let actualValue;

    try {
      const records = await this.client.retrieveMultiple(request);
      const lead = records.find((lead: any) => lead['emailaddress1'] == email);
      let leadRecord;
      if (!lead) {
        return this.error('No Lead was found with email %s', [email]);
      } else {
        actualValue = lead[field];
        if (isDate(lead[field])) {
          actualValue = lead[field].toISOString();
        }
        delete lead['@odata.etag'];
        leadRecord = this.createRecord(lead);
      }

      if (this.compare(operator, actualValue, expectedValue)) {
        return this.pass(this.operatorSuccessMessages[operator], [field, expectedValue], [leadRecord]);
      } else {
        return this.fail(this.operatorFailMessages[operator], [field, expectedValue, actualValue], [leadRecord]);
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

  public createRecord(lead): StepRecord {
    const obj = {};
    Object.keys(lead).forEach(key => obj[key] = lead[key]);
    obj['createdon'] = obj['createdon'].toISOString();
    obj['modifiedon'] = obj['modifiedon'].toISOString();
    const record = this.keyValue('contact', 'Checked Contact', obj);
    return record;
  }

}

export { LeadFieldEquals as Step };
