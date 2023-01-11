/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RunStepResponse, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import { isDate } from 'util';
import * as moment from 'moment';

export class CreateContact extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Dynamics CRM contact';
  protected stepExpression: string = 'create a dynamics crm contact';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['create'];
  protected targetObject: string = 'Contact';
  protected expectedFields: Field[] = [{
    field: 'contact',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
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
    const dateTokenFormat = /^\d{4}-\d{2}-\d{2}(?:.?\d{2}:\d{2}:\d{2})?(?:\.\d{3}.?)?$/;
    for (const key in stepData.contact) {
      if (!isNaN(stepData.contact[key])) {
        stepData.contact[key] = parseFloat(stepData.contact[key]);
      } else if (dateTokenFormat.test(stepData.contact[key])) {
        stepData.contact[key] = stepData.contact[key].includes('00:00:00') ? moment(stepData.contact[key]).format('YYYY-MM-DD') : stepData.contact[key];
      }
    }

    const request = {
      collection: 'contacts',
      entity: stepData.contact,
      returnRepresentation: true,
    };
    try {
      const result = await this.client.create(request);

      delete result['@odata.etag'];
      const record = this.createRecord(result);
      const orderedRecord = this.createOrderedRecord(result, stepData['__stepOrder']);
      return this.pass('Successfully created Contact with ID %s', [result['contactid']], [record, orderedRecord]);
    } catch (e) {
      return this.error('There was a problem creating the Contact: %s', [e.toString()]);
    }
  }

  public createRecord(contact): StepRecord {
    const obj = {};
    Object.keys(contact).forEach((key) => {
      obj[key] = isDate(contact[key]) ? contact[key].toISOString() : contact[key];
    });
    const record = this.keyValue('contact', 'Created Contact', obj);
    return record;
  }

  public createOrderedRecord(contact, stepOrder = 1): StepRecord {
    const obj = {};
    Object.keys(contact).forEach((key) => {
      obj[key] = isDate(contact[key]) ? contact[key].toISOString() : contact[key];
    });
    const record = this.keyValue(`contact.${stepOrder}`, `Created Contact from Step ${stepOrder}`, obj);
    return record;
  }

}

export { CreateContact as Step };
