import { RedisClient, ClientOpts } from 'redis';

import { promisify } from 'util';



// client.on("error", function (error) {
//     console.error(error);
// });

// client.set("key", "value", redis.print);
// client.get("key", redis.print);

import { EventEmitter } from 'events';

class RedisDb extends EventEmitter {
    static client: RedisClient;
    redisConfig: ClientOpts = { host: process.env.REDIS_SERVER };
    private getXread;
    constructor() {
        super();

        RedisDb.client = new RedisClient(this.redisConfig);
        this.initDb();


    }

    private initDb() {
        RedisDb.client.on('ready', () => {
            console.log(`@hoppeh/db: DB Connection established`);

        });

        RedisDb.client.on('error', err => {
            console.log(`Database connection error: ${err}`);
            // throw new err();
        });
        // console.log(pool);
    }

    public insertMessage(key, data) {
        return new Promise((resolve, reject) => {
            RedisDb.client.set(key, data, 'EX', 10, (err, res) => {

                if (err) {
                    console.log(err);
                    return reject(err)
                }
                console.log(res)
                return resolve(res);
            })

        })

    }



    public getDB() {
        if (!RedisDb.client) {
            RedisDb.client = new RedisClient(this.redisConfig);
        }
        return RedisDb.client;
    }

    public getDBStatus() {
        // console.log(RedisDb.pool.connected);
        if (!RedisDb.client.connected) {
            return false;
        }
        return true;
    }
}

export const redisDb = new RedisDb();
