import { ClientWrapper } from '../client/client-wrapper';
import { promisify } from 'util';
​​
class CachingClientWrapper {
  // cachePrefix is scoped to the specific scenario, request, and requestor
  public cachePrefix = `${this.idMap.scenarioId}${this.idMap.requestorId}${this.idMap.connectionId}`;

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
    const cachekey = `Dynamics|${request.collection}|${email}|${this.cachePrefix}`;
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
    await this.clearCache();
    return await this.client.create(request);
  }

  public async delete(request: any) {
    await this.clearCache();
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
      // arrOfKeys will store an array of all cache keys used in this scenario run, so it can be cleared easily
      const arrOfKeys = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      arrOfKeys.push(key);
      await this.setAsync(key, 55, JSON.stringify(value));
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, JSON.stringify(arrOfKeys));
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

  public async clearCache() {
    try {
      // clears all the cachekeys used in this scenario run
      const keysToDelete = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      if (keysToDelete.length) {
        keysToDelete.forEach(async (key: string) => await this.delAsync(key));
      }
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, '[]');
    } catch (err) {
      console.log(err);
    }
  }
}
​
export { CachingClientWrapper as CachingClientWrapper };
