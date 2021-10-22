import { ClientWrapper } from '../client/client-wrapper';
import { promisify } from 'util';
​​
class CachingClientWrapper {
  // cachePrefix is scoped to the specific scenario, request, and requestor
  public cachePrefix = `${this.idMap.requestId}${this.idMap.scenarioId}${this.idMap.requestorId}Dynamics`;

  constructor(private client: ClientWrapper, public redisClient: any, public idMap: any) {
    this.redisClient = redisClient;
    this.idMap = idMap;
  }

  // Entity aware methods
  // -------------------------------------------------------------------

  public async retrieveMultiple(request: any) {
    // Extract the email out of the request
    const email = request.filter ? request.filter.slice(27, -2) : '';
    // If this is part of a delete step or there is no email, forward it to the original function
    if (request.select || !email) {
      return await this.client.retrieveMultiple(request);
    }
    // The request.collection in this case will be either 'contacts' or 'leads'
    const cachekey = `${this.cachePrefix}${request.collection}${email}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.retrieveMultiple(request);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  public async create(request: any) {
    const response = await this.client.create(request);
    if (response && response.emailaddress1) {
      await this.delCache(`${this.cachePrefix}${request.collection}${response.emailaddress1}`);
    }
    return response;
  }

  public async delete(request: any, email: string) {
    await this.delCache(`${this.cachePrefix}${request.collection}${email}`);
    return await this.client.delete(request);
  }

  // Redis methods for get, set, and delete
  // -------------------------------------------------------------------

  // Async getter/setter
  public getAsync = promisify(this.redisClient.get).bind(this.redisClient);
  public setAsync = promisify(this.redisClient.setex).bind(this.redisClient);
  public delAsync = promisify(this.redisClient.del).bind(this.redisClient);

  public async getCache(key: string) {
    try {
      const stored = await this.getAsync(key);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (err) {
      console.log(err);
    }
  }

  public async setCache(key: string, value: any) {
    try {
      await this.setAsync(key, 600, JSON.stringify(value));
    } catch (err) {
      console.log(err);
    }
  }

  public async delCache(key: string) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.log(err);
    }
  }
}
​
export { CachingClientWrapper as CachingClientWrapper };
