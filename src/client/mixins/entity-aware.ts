import * as DynamicsWebApi from 'dynamics-web-api';

export class EntityAwareMixin {
  clientReady: Promise<boolean>;
  client: DynamicsWebApi;

  public async create(request: any): Promise<any> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.createRequest(request).then((record) => {
          resolve(record);
        }).catch((e) => {
          if (e.status == '401') {
            reject('Credentials are invalid. Please check them and try again.');
          }
          if (e.status == '400') {
            reject(JSON.stringify(e.message).split('\\r', 1)[0].replace('\\', ''));
          }
          reject(e);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  public async delete(request: any): Promise<any> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.deleteRequest(request).then((isDeleted) => {
          resolve(isDeleted);
        }).catch((e) => {
          if (e.status == '401') {
            reject('Credentials are invalid. Please check them and try again.');
          }
          if (e.status == '400') {
            reject(JSON.stringify(e.message).split('\\r', 1)[0].replace('\\', ''));
          }
          reject(e);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  public async retrieveMultiple(request: any): Promise<any> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.retrieveMultipleRequest(request).then((records) => {
          resolve(records.value);
        }).catch((e) => {
          if (e.status == '401') {
            reject('Credentials are invalid. Please check them and try again.');
          }
          if (e.status == '400') {
            reject(JSON.stringify(e.message).split('\\r', 1)[0].replace('\\', ''));
          }
          reject(e);
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
