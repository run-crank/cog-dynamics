import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/contact/contact-discover';

chai.use(sinonChai);

describe('DiscoverContactStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  const clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub.retrieveMultiple = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('DiscoverContact');
    expect(stepDef.getName()).to.equal('Discover fields on a Dynamics CRM contact');
    expect(stepDef.getExpression()).to.equal('discover fields on dynamics crm contact (?<email>.+)');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    const email: any = fields.filter(f => f.key === 'email')[0];
    expect(email.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(email.type).to.equal(FieldDefinition.Type.EMAIL);
  });

  it('should respond with pass if contact is found.', async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        contactid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'somefirstname',
        createdon: new Date(),
        modifiedon: new Date(),
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'contacts',
      filter: `startswith(emailaddress1, '${expectedRetrieveResponse[0].emailaddress1}')`,
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedContact: any = {
      email: 'anyemail@email.com'
    };
    protoStep.setData(Struct.fromJavaScript(expectedContact));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with fail if contact is not found.', async () => {
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'contacts',
      filter: `startswith(emailaddress1, 'anyemail@email.com')`,
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(null);

    // Set step data corresponding to expectations
    const expectedContact: any = {
      email: 'anyemail@email.com'
    };
    protoStep.setData(Struct.fromJavaScript(expectedContact));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if request returns an error.', async () => {
    // Stub a response that matches expectations.
    const expectedError: Error = new Error('Any Error');
    clientWrapperStub.retrieveMultiple.rejects(expectedError);

    // Set step data corresponding to expectations
    const expectedContact: any = {
      email: 'anyemail@email.com'
    };
    protoStep.setData(Struct.fromJavaScript(expectedContact));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
