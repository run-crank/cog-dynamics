import { RunStepRequest } from './../proto/cog_pb.d';
import * as DynamicsWebApi from 'dynamics-web-api';
import * as AuthenticationContext from 'adal-node';
import * as grpc from 'grpc';
import * as needle from 'needle';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';

/**
 * This is a wrapper class around the API client for your Cog. An instance of
 * this class is passed to the constructor of each of your steps, and can be
 * accessed on each step as this.client.
 */
export class ClientWrapper {

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
  private client: any;
  private clientReady: Promise<boolean>;

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
  constructor(auth: grpc.Metadata, clientConstructor = DynamicsWebApi, adal = AuthenticationContext) {
    var authContext = adal.AuthenticationContext;
    var adalContext = new authContext(`https://login.microsoftonline.com/${auth.get('tenantId')[0]}/oauth2/token`);

    function acquireToken(dynamicsWebApiCallback) {
      function adalCallback(error, token) {
        if (!error) {
          dynamicsWebApiCallback(token);
        }
        else {
          console.log('Token has not been retrieved. Error: ' + error.stack);
        }
      }

      adalContext.acquireTokenWithClientCredentials(auth.get('resource')[0].toString(), auth.get('clientId')[0].toString(), auth.get('clientSecret')[0].toString(), adalCallback);
    }

    this.client = new clientConstructor({
      webApiUrl: `${auth.get('resource')}/api/data/v9.0/`,
      onTokenRefresh: acquireToken
    });
  }

  public async create(request: any): Promise<any> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.createRequest(request).then(function (record) {
          resolve(record);
        }).catch(function (e) {
          reject(e);
        })
      } catch (e) {
        reject(e);
      }
    });
  }

  public async delete(request: any): Promise<any> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.deleteRequest(request).then(function (isDeleted) {
          if (isDeleted){
              resolve(true);
          }
          else{
              resolve(false);
          }
        }).catch(function (e) {
          reject(e);
        })
      } catch (e) {
        reject(e);
      }
    });
  }

  public async retrieveMultiple(request: any): Promise<any> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.retrieveMultipleRequest(request).then(function (records) {
          resolve(records.value);
        }).catch(function (e) {
          reject(e);
        })
      } catch (e) {
        reject(e);
      }
    });
  }
}
