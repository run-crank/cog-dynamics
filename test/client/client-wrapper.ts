import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import * as justForIdeTypeHinting from 'chai-as-promised';
import 'mocha';

import { ClientWrapper } from '../../src/client/client-wrapper';
import { Metadata } from 'grpc';

chai.use(sinonChai);

describe('ClientWrapper', () => {
  const expect = chai.expect;
  let dynamicsClientStub: any;
  let adalStub: any;
  // let metadata: Metadata;
  // let clientWrapperUnderTest: ClientWrapper;

  beforeEach(() => {
    dynamicsClientStub = sinon.stub();
    adalStub = sinon.stub();
    adalStub.acquireTokenWithClientCredentials = sinon.stub();
  });

  // it('authenticates', () => {
  //   // Construct grpc metadata and assert the client was authenticated.
  //   const expectedCallArgs = {
  //     tenantId: 'Some/UserAgent String',
  //     resource: 'Some/Resource String',
  //     clientId: 'Some/ClientId String',
  //     clientSecret: 'Some/ClientSecret String',
  //   };
  //   metadata = new Metadata();
  //   metadata.add('tenantId', expectedCallArgs.tenantId);
  //   metadata.add('resource', expectedCallArgs.resource);
  //   metadata.add('clientId', expectedCallArgs.clientId);
  //   metadata.add('clientSecret', expectedCallArgs.clientSecret);

  //   adalStub.acquireTokenWithClientCredentials.resolves('sampleToken');
  //   const config = {
  //     webApiUrl: 'Some/Resource String/api/adata/v9.0/',
  //     onTokenRefresh: 'sampleToken',
  //   };

  //   // Assert that the underlying API client was authenticated correctly.
  //   clientWrapperUnderTest = new ClientWrapper(metadata, dynamicsClientStub, adalStub);
  //   expect(dynamicsClientStub).to.have.been.calledWith(config);
  // });
});
