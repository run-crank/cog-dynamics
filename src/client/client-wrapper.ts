import * as DynamicsWebApi from 'dynamics-web-api';
import * as AuthenticationContext from 'adal-node';
import * as grpc from 'grpc';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';
import { EntityAwareMixin } from './mixins/entity-aware';

/**
 * This is a wrapper class around the API client for your Cog. An instance of
 * this class is passed to the constructor of each of your steps, and can be
 * accessed on each step as this.client.
 */
class ClientWrapper {

  /**
   * This is an array of field definitions, each corresponding to a field that
   * your API client requires for authentication. Depending on the underlying
   * system, this could include bearer tokens, basic auth details, endpoints,
   * etc.
   *
   * If your Cog does not require authentication, set this to an empty array.
   */
  public static expectedAuthFields: Field[] = [
    {
      field: 'tenantId',
      type: FieldDefinition.Type.STRING,
      description: 'TenantId String',
    },
    {
      field: 'resource',
      type: FieldDefinition.Type.STRING,
      description: 'Resource URL String',
    },
    {
      field: 'clientId',
      type: FieldDefinition.Type.STRING,
      description: 'Client Id String',
    },
    {
      field: 'clientSecret',
      type: FieldDefinition.Type.STRING,
      description: 'Client Secret String',
    },
  ];

  /**
   * Private instance of the wrapped API client. You will almost certainly want
   * to swap this out for an API client specific to your Cog's needs.
   */
  public client: any;
  public clientReady: Promise<boolean>;

  /**
   * Constructs an instance of the ClientWwrapper, authenticating the wrapped
   * client in the process.
   *
   * @param auth - An instance of GRPC Metadata for a given RunStep or RunSteps
   *   call. Will be populated with authentication metadata according to the
   *   expectedAuthFields array defined above.
   *
   * @param clientConstructor - An optional parameter Used only as a means to
   *   simplify automated testing. Should default to the class/constructor of
   *   the underlying/wrapped API client.
   */
  // tslint:disable-next-line:max-line-length
  constructor(auth: grpc.Metadata, clientConstructor = DynamicsWebApi, adal = AuthenticationContext) {
    const authContext = adal.AuthenticationContext;
    const adalContext = new authContext(`https://login.microsoftonline.com/${auth.get('tenantId')[0]}/oauth2/token`);
    function acquireToken(dynamicsWebApiCallback) {
      adalContext.acquireTokenWithClientCredentials(
        auth.get('resource')[0].toString(),
        auth.get('clientId')[0].toString(),
        auth.get('clientSecret')[0].toString(),
        (error, token) => {
          dynamicsWebApiCallback(token);
          this.clientReady = Promise.resolve(true);
        });
    }
    this.client = new clientConstructor({
      webApiUrl: `${auth.get('resource')}/api/data/v9.0/`,
      onTokenRefresh: acquireToken,
    });
  }
}

interface ClientWrapper extends EntityAwareMixin {}
applyMixins(ClientWrapper, [EntityAwareMixin]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
          // tslint:disable-next-line:max-line-length
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
    });
  });
}

export { ClientWrapper as ClientWrapper };
