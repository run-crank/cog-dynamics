/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RunStepResponse, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';
import { isDate, isNullOrUndefined } from 'util';

export class ContactFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Dynamics CRM Contact';
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on dynamics crm contact (?<email>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectedValue>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Contact's email address",
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
    optionality: FieldDefinition.Optionality.OPTIONAL,
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
    const field: string = stepData.field;
    const operator: string = stepData.operator || 'be';
    const expectedValue: string = stepData.expectedValue;
    const request = {
      collection: 'contacts',
      filter: `startswith(emailaddress1, '${stepData.email}')`,
      count: true,
    };
    let actualValue;

    if (isNullOrUndefined(expectedValue) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      const records = await this.client.retrieveMultiple(request);
      const contact = records.find((contact: any) => contact['emailaddress1'] == email);
      let contactRecord;
      if (!contact) {
        return this.error('No Contact was found with email %s', [email]);
      } else {
        actualValue = contact[field];
        if (isDate(contact[field])) {
          actualValue = contact[field].toISOString();
        }
        delete contact['@odata.etag'];
        contactRecord = this.createRecord(contact);
      }

      const result = this.assert(operator, actualValue, expectedValue, field);

      return result.valid ? this.pass(result.message, [], [contactRecord])
        : this.fail(result.message, [], [contactRecord]);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error('There was an error checking the contact field: %s', [e.message]);
      }
      return this.error('There was an checking the contact field: %s', [e.toString()]);
    }
  }

  public createRecord(contact): StepRecord {
    const obj = {};
    Object.keys(contact).forEach((key) => {
      obj[key] = isDate(contact[key]) ? contact[key].toISOString() : contact[key];
    });
    const record = this.keyValue('contact', 'Checked Contact', obj);
    return record;
  }

}

export { ContactFieldEquals as Step };
