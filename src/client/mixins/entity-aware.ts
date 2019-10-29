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
          if (e.status.toString() === '401' || e.status.toString() === '400' || e.code.toString() === 'ENOTFOUND') {
            reject('Credentials are invalid. Please check them and try again.');
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
          if (isDeleted) {
            resolve(true);
          } else {
            resolve(false);
          }
        }).catch((e) => {
          if (e.status.toString() === '401' || e.status.toString() === '400') {
            reject('Credentials are invalid. Please check them and try again.');
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
          if (e.status == '401' || e.status == '400' || e.code == 'ENOTFOUND') {
            reject('Credentials are invalid. Please check them and try again.');
          }
          reject(e);
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
