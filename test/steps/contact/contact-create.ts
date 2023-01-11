import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/contact/contact-create';

chai.use(sinonChai);

describe('CreateContactStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  const clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub.create = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('CreateContact');
    expect(stepDef.getName()).to.equal('Create a Dynamics CRM contact');
    expect(stepDef.getExpression()).to.equal('create a dynamics crm contact');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Contact field
    const contact: any = fields.filter(f => f.key === 'contact')[0];
    expect(contact.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(contact.type).to.equal(FieldDefinition.Type.MAP);
  });

  it('should respond with pass if contact is created.', async () => {
    // Set step data corresponding to expectations
    const expectedContact: any = {
      contactid: 'someID',
      emailaddress1: 'anything@example.com',
      firstname: 'sample',
      lastname: 'sample',
      createdon: new Date(),
      modifiedon: new Date(),
      closedate: '2020-06-26T04:00:00.000Z',
    };
    const contactInput: any = {
      contact: {
        emailaddress1: 'anything@example.com',
        firstname: 'sample',
        lastname: 'sample',
      },
    };

    // Stub a response that matches expectations.
    clientWrapperStub.create.resolves(expectedContact);

    protoStep.setData(Struct.fromJavaScript(contactInput));
    const request = {
      collection: 'contacts',
      entity: contactInput.contact,
      returnRepresentation: true,
    };

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.create).to.have.been.calledWith(request);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error if create method returns an error.', async () => {
    // Stub a response that matches expectations.
    const expectedError: Error = new Error('Any Error');
    clientWrapperStub.create.rejects(expectedError);

    // Set step data corresponding to expectations
    const expectedContact: any = { contact: { Email: 'anything@example.com' } };
    protoStep.setData(Struct.fromJavaScript(expectedContact));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
