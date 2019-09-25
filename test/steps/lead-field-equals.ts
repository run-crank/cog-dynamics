import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../src/proto/cog_pb';
import { Step } from '../../src/steps/lead-field-equals';

chai.use(sinonChai);

describe('LeadFieldEqualsStep', () => {
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
    expect(stepDef.getStepId()).to.equal('LeadFieldEquals');
    expect(stepDef.getName()).to.equal('Check a field on a Dynamics CRM Lead');
    expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_]+) field on dynamics lead (?<email>.+) should be (?<expectedValue>.+)');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    const email: any = fields.filter(f => f.key === 'email')[0];
    expect(email.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(email.type).to.equal(FieldDefinition.Type.STRING);
    const field: any = fields.filter(f => f.key === 'field')[0];
    expect(field.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(field.type).to.equal(FieldDefinition.Type.STRING);
    const expectedValue: any = fields.filter(f => f.key === 'expectedValue')[0];
    expect(expectedValue.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(expectedValue.type).to.equal(FieldDefinition.Type.ANYSCALAR);
  });

  it('should respond with pass if lead field matches expected value.', async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'somefirstname',
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      select: ['emailaddress1', 'firstname'],
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = {
      email: 'anyemail@email.com',
      field: 'firstname',
      expectedValue: 'somefirstname',
    };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with fail if lead field does not match expected value.', async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'somefirstname',
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      select: ['emailaddress1', 'firstname'],
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = {
      email: 'anyemail@email.com',
      field: 'firstname',
      expectedValue: 'NOTsomefirstname',
    };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if create method returns an error.', async () => {
    // Stub a response that matches expectations.
    const expectedError: Error = new Error('Any Error');
    clientWrapperStub.retrieveMultiple.rejects(expectedError);

    // Set step data corresponding to expectations
    const expectedLead: any = {
      email: 'anyemail@email.com',
      field: 'firstname',
      expectedValue: 'somefirstname',
    };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
