// import * as chai from 'chai';
// import { default as sinon } from 'ts-sinon';
// import * as sinonChai from 'sinon-chai';
// import * as justForIdeTypeHinting from 'chai-as-promised';
// import 'mocha';

// import { ClientWrapper } from '../../src/client/client-wrapper';
// import { Metadata } from 'grpc';

// chai.use(sinonChai);

// describe('ClientWrapper', () => {
//   const expect = chai.expect;
//   let dynamicsClientStub: any;
//   let dynamicsClientConstructorStub: any;
//   let adalStub: any;
//   let adalContextStub: any;
//   let requestClientStub: any;
//   let metadata: Metadata;
//   let clientWrapperUnderTest: ClientWrapper;
//   beforeEach(() => {
//     dynamicsClientStub = sinon.stub();
//     dynamicsClientConstructorStub = sinon.stub();
//     dynamicsClientConstructorStub.returns(dynamicsClientStub);
//     adalStub = sinon.stub();
//     adalStub.AuthenticationContext = sinon.stub();
//     adalContextStub = sinon.stub();
//     adalContextStub.acquireTokenWithClientCredentials = sinon.stub();
//     adalStub.AuthenticationContext.returns(adalContextStub);
//     requestClientStub = sinon.stub();
//   });

//   it('authenticates', () => {
//     // Construct grpc metadata and assert the client was authenticated.
//     const expectedCallArgs = {
//       resource: 'Some/Resource String',
//       clientId: 'Some/ClientId String',
//       clientSecret: 'Some/ClientSecret String',
//     };
//     metadata = new Metadata();
//     metadata.add('resource', expectedCallArgs.resource);
//     metadata.add('clientId', expectedCallArgs.clientId);
//     metadata.add('clientSecret', expectedCallArgs.clientSecret);

//     function acquireToken(dynamicsWebApiCallback) {
//       adalContextStub.acquireTokenWithClientCredentials.calledWith(
//         expectedCallArgs.resource,
//         expectedCallArgs.clientId,
//         expectedCallArgs.clientSecret,
//         (error, token) => {
//           dynamicsWebApiCallback(token);
//         },
//       );
//     }
//     adalContextStub.acquireTokenWithClientCredentials.resolves('sampleToken');
//     requestClientStub.resolves('someTenantId');

//     const args = {
//       webApiUrl: `${expectedCallArgs.resource}/api/data/v9.0/`,
//       onTokenRefresh: acquireToken,
//     };

//     // Assert that the underlying API client was authenticated correctly.
//     clientWrapperUnderTest = new ClientWrapper(metadata, dynamicsClientConstructorStub, adalStub, requestClientStub);
//     // expect(dynamicsClientConstructorStub).to.have.been.calledWith(args);
//     expect(dynamicsClientConstructorStub).to.have.returned(dynamicsClientStub);
//   });

//   // describe('Entity', () => {
//   //   beforeEach(() => {
//   //     dynamicsClientConstructorStub = sinon.stub();
//   //     dynamicsClientConstructorStub.returns(dynamicsClientStub);
//   //     dynamicsClientStub = sinon.stub();
//   //     dynamicsClientStub.createRequest = sinon.stub();
//   //     adalStub = sinon.stub();
//   //     adalStub.acquireTokenWithClientCredentials = sinon.stub();
//   //   });

//   //   it('create:resolves', () => {
//   //     // Construct grpc metadata and assert the client was authenticated.
//   //     const expectedCallArgs = {
//   //       resource: 'Some/Resource String',
//   //       clientId: 'Some/ClientId String',
//   //       clientSecret: 'Some/ClientSecret String',
//   //     };
//   //     metadata = new Metadata();
//   //     metadata.add('resource', expectedCallArgs.resource);
//   //     metadata.add('clientId', expectedCallArgs.clientId);
//   //     metadata.add('clientSecret', expectedCallArgs.clientSecret);

//   //     const sampleRequest = {
//   //       someData: 'sampleData',
//   //     };

//   //     // Assert that the underlying API client was authenticated correctly.
//   //     clientWrapperUnderTest = new ClientWrapper(metadata, dynamicsClientConstructorStub, adalStub);
//   //     expect(dynamicsClientStub.createRequest).has.been.calledWith();
//   //   });
//   // });
// });
