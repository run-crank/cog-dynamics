import * as DynamicsWebApi from 'dynamics-web-api';
import * as AuthenticationContext from 'adal-node';
import * as grpc from 'grpc';
import * as request from 'request';
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
      field: 'resource',
      type: FieldDefinition.Type.URL,
      description: 'Resource URL',
    },
    {
      field: 'clientId',
      type: FieldDefinition.Type.STRING,
      description: 'Client Id',
    },
    {
      field: 'clientSecret',
      type: FieldDefinition.Type.STRING,
      description: 'Client Secret',
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
    // Client instantiation is async; all steps await this.clientReady.
    this.clientReady = new Promise(async (clientIsReady, clientError) => {
      // First, get the tenant ID dynamically using a "bearer challenge"
      const tenantId = await new Promise((resolve) => {
        request(`${auth.get('resource')[0].toString()}/api/data`, (err, res) => {
          if (err) {
            return clientError(err);
          }
          if (!res.headers.hasOwnProperty('www-authenticate')) {
            return clientError(Error('Authentication error: unable to retrieve tenant ID using resource URL.'));
          }

          const matches = /\.microsoftonline\.com\/([a-zA-Z0-9-]+)\//gi.exec(res.headers['www-authenticate']);
          if (!matches || !matches[1]) {
            return clientError('Authentication error: unable to extract tenant ID from bearer challenge.');
          }

          resolve(matches[1]);
        });
      });

      // Then, set the client using the given tenant ID, resource, etc.
      const authContext = adal.AuthenticationContext;
      const adalContext = new authContext(`https://login.microsoftonline.com/${tenantId}/oauth2/token`);
      function acquireToken(dynamicsWebApiCallback) {
        adalContext.acquireTokenWithClientCredentials(
          auth.get('resource')[0].toString(),
          auth.get('clientId')[0].toString(),
          auth.get('clientSecret')[0].toString(),
          (error, token) => {
            dynamicsWebApiCallback(token);
          },
        );
      }
      this.client = new clientConstructor({
        webApiUrl: `${auth.get('resource')[0].toString()}/api/data/v9.0/`,
        onTokenRefresh: acquireToken,
      });

      // Resolve this.clientReady.
      clientIsReady(true);
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
