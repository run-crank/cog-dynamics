import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../src/proto/cog_pb';
import { Step } from '../../src/steps/create-lead';

chai.use(sinonChai);

describe('CreateLeadStep', () => {
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
    expect(stepDef.getStepId()).to.equal('CreateLead');
    expect(stepDef.getName()).to.equal('Create a Dynamics CRM Lead');
    expect(stepDef.getExpression()).to.equal('create a dynamics crm lead');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Lead field
    const lead: any = fields.filter(f => f.key === 'lead')[0];
    expect(lead.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(lead.type).to.equal(FieldDefinition.Type.MAP);
  });

  it('should respond with pass if lead is created.', async () => {
    // Set step data corresponding to expectations
    const expectedLead: any = {
      leadid: 'someID',
      emailaddress1: 'anything@example.com',
      firstname: 'sample',
      lastname: 'sample',
      createdon: new Date(),
      modifiedon: new Date(),
      closedate: '2020-06-26T04:00:00.000Z',
    };
    const leadInput: any = {
      lead: {
        emailaddress1: 'anything@example.com',
        firstname: 'sample',
        lastname: 'sample',
      },
    };

    // Stub a response that matches expectations.
    clientWrapperStub.create.resolves(expectedLead);

    protoStep.setData(Struct.fromJavaScript(leadInput));
    const request = {
      collection: 'leads',
      entity: leadInput.lead,
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
    const expectedLead: any = { lead: { Email: 'anything@example.com' } };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
