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
    expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_]+) field on dynamics crm lead (?<email>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectedValue>.+)?');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    const email: any = fields.filter(f => f.key === 'email')[0];
    expect(email.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(email.type).to.equal(FieldDefinition.Type.EMAIL);
    const field: any = fields.filter(f => f.key === 'field')[0];
    expect(field.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(field.type).to.equal(FieldDefinition.Type.STRING);
    const operator: any = fields.filter(f => f.key === 'operator')[0];
    expect(operator.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
    expect(operator.type).to.equal(FieldDefinition.Type.STRING);
    const expectedValue: any = fields.filter(f => f.key === 'expectedValue')[0];
    expect(expectedValue.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
    expect(expectedValue.type).to.equal(FieldDefinition.Type.ANYSCALAR);
  });

  it('should respond with pass if lead field matches expected value with no operator provided.', async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'somefirstname',
        createdon: new Date(),
        modifiedon: new Date(),
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${expectedRetrieveResponse[0].emailaddress1}')`,
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

  it("should respond with pass if lead field matches expected value with 'be' operator provided.", async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'somefirstname',
        createdon: new Date(),
        modifiedon: new Date(),
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${expectedRetrieveResponse[0].emailaddress1}')`,
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = {
      email: 'anyemail@email.com',
      field: 'firstname',
      operator: 'be',
      expectedValue: 'somefirstname',
    };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it("should respond with pass if lead field matches expected value with 'not be' operator provided.", async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'someOtherfirstname',
        createdon: new Date(),
        modifiedon: new Date(),
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${expectedRetrieveResponse[0].emailaddress1}')`,
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = {
      email: 'anyemail@email.com',
      field: 'firstname',
      operator: 'not be',
      expectedValue: 'somefirstname',
    };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it("should respond with pass if lead field matches expected value with 'contain' operator provided.", async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'somefirstname',
        createdon: new Date(),
        modifiedon: new Date(),
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${expectedRetrieveResponse[0].emailaddress1}')`,
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = {
      email: 'anyemail@email.com',
      field: 'firstname',
      operator: 'contain',
      expectedValue: 'some',
    };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it("should respond with pass if lead field matches expected value with 'not contain' operator provided.", async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'sumfirstname',
        createdon: new Date(),
        modifiedon: new Date(),
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${expectedRetrieveResponse[0].emailaddress1}')`,
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = {
      email: 'anyemail@email.com',
      field: 'firstname',
      operator: 'not contain',
      expectedValue: 'some',
    };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it("should respond with pass if lead field is an number field matches expected value with 'be greater than' operator provided.", async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'sumfirstname',
        someNumberField: '200',
        createdon: new Date(),
        modifiedon: new Date(),
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${expectedRetrieveResponse[0].emailaddress1}')`,
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = {
      email: 'anyemail@email.com',
      field: 'someNumberField',
      operator: 'be greater than',
      expectedValue: '100',
    };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it("should respond with pass if lead field is a number field and matches expected value with 'be less than' operator provided.", async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'sumfirstname',
        someNumberField: '50',
        createdon: new Date(),
        modifiedon: new Date(),
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${expectedRetrieveResponse[0].emailaddress1}')`,
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = {
      email: 'anyemail@email.com',
      field: 'someNumberField',
      operator: 'be less than',
      expectedValue: '100',
    };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it("should respond with pass if lead field is a date field and matches expected value with 'be greater than' operator provided.", async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'somefirstname',
        someDateField: '2001-01-01',
        createdon: new Date(),
        modifiedon: new Date(),
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${expectedRetrieveResponse[0].emailaddress1}')`,
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = {
      email: 'anyemail@email.com',
      field: 'someDateField',
      operator: 'be greater than',
      expectedValue: '2000-01-01',
    };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it("should respond with pass if lead field is a date field and matches expected value with 'be less than' operator provided.", async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'sumfirstname',
        someDateField: '1999-01-01',
        createdon: new Date(),
        modifiedon: new Date(),
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${expectedRetrieveResponse[0].emailaddress1}')`,
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = {
      email: 'anyemail@email.com',
      field: 'someDateField',
      operator: 'be less than',
      expectedValue: '2000-01-01',
    };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it("should respond with error if lead field or expected field is number field but value is not a number and operator is 'be greater than'.", async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'sumfirstname',
        someNumberField: '50',
        createdon: new Date(),
        modifiedon: new Date(),
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${expectedRetrieveResponse[0].emailaddress1}')`,
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = {
      email: 'anyemail@email.com',
      field: 'someNumberField',
      operator: 'be greater than',
      expectedValue: 'notANumber',
    };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it("should respond with error if lead field or expected field is number field but value is not a number and operator is 'be less than'.", async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'sumfirstname',
        someNumberField: '50',
        createdon: new Date(),
        modifiedon: new Date(),
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${expectedRetrieveResponse[0].emailaddress1}')`,
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = {
      email: 'anyemail@email.com',
      field: 'someNumberField',
      operator: 'be less than',
      expectedValue: 'notANumber',
    };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if operator provided is invalid.', async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'sumfirstname',
        someNumberField: '50',
        createdon: new Date(),
        modifiedon: new Date(),
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${expectedRetrieveResponse[0].emailaddress1}')`,
      count: true,
    };
    clientWrapperStub.retrieveMultiple.resolves(expectedRetrieveResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = {
      email: 'anyemail@email.com',
      field: 'someNumberField',
      operator: 'invalidOperator',
      expectedValue: '100',
    };
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.retrieveMultiple).to.have.been.calledWith(retrieveRequest);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with fail if lead field does not match expected value.', async () => {
    // Stub a response that matches expectations.
    const expectedRetrieveResponse: any = [
      {
        leadid:'anyId',
        emailaddress1: 'anyemail@email.com',
        firstname: 'somefirstname',
        createdon: new Date(),
        modifiedon: new Date(),
      },
    ];
    // A request with firstname as sample field
    const retrieveRequest = {
      collection: 'leads',
      filter: `startswith(emailaddress1, '${expectedRetrieveResponse[0].emailaddress1}')`,
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
