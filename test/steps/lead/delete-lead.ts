import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/lead/delete-lead';

chai.use(sinonChai);

describe('DeleteLeadStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub = sinon.stub();
    clientWrapperStub.retrieveMultiple = sinon.stub();
    clientWrapperStub.delete = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('DeleteLead');
    expect(stepDef.getName()).to.equal('Delete a Dynamics CRM Lead');
    expect(stepDef.getExpression()).to.equal('delete the (?<email>.+) dynamics crm lead');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Lead field
    const lead: any = fields.filter(f => f.key === 'email')[0];
    expect(lead.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(lead.type).to.equal(FieldDefinition.Type.EMAIL);
  });

  it('should respond with pass if lead is deleted.', async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
      },
    ];
    const expectedDeleteResponse: any = true;

    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);
    clientWrapperStub.delete.resolves(expectedDeleteResponse);

    const retrieveRequest = {
      collection: 'leads',
      select: ['emailaddress1'],
      count: true,
    };
    const deleteRequest = {
      key: expectedRetrieveResponse[0].leadid,
      collection: 'leads',
    };
    // Set step data corresponding to expectations
    const expectedLead: any = { email: 'anyemail@email.com' };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(clientWrapperStub.delete).to.have.been.calledWith(deleteRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error if not able to get lead with expected email.', async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'NOTanyemail@email.com',
      },
    ];
    const expectedResponseMessage: string = 'Lead %s does not exist';

    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = { email: 'anyemail@email.com' };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if delete method returns an error.', async () => {
    // Stub a response that matches expectations.
    const expectedError: Error = new Error('Any Error');
    clientWrapperStub.retrieveMultiple(expectedError);

    // Set step data corresponding to expectations
    const expectedLead: any = { lead: { email: 'anything@example.com' } };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
