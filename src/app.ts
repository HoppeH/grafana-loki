// const config = require('./config')
// import { LevelController } from './LevelController'
import session from 'cookie-session';
// const TaskDao = require('./models/taskDao')
// import helmet from 'helmet';
import express, { Request, Response, NextFunction } from 'express';

import { redisDb } from './redis'

const path = require('path')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

import * as promClient from 'prom-client';




import cors from 'cors';

interface ErrorWithStatus extends Error {
    status: number;
}

class App {
    private redis = redisDb.getDB();
    private config = {
        endpoint: process.env.COSMOS_DB_URL || '',
        key: process.env.COSMOS_DB_KEY || '',
        databaseId: process.env.COSMOS_DB_ID || '',
        containerId: process.env.COSMOS_DB_CONTAINER || '',
        partitionKey: { paths: ["/UserId"] }
    };



    // Prometheus

    private collectDefaultMetrics = promClient.collectDefaultMetrics;
    private prefix = 'apitest';




    // CORS
    private allowedOrigins: string[] =
        ['http://someorigin.com',
            'http://anotherorigin.com',
            'http://localhost:3001'];

    private corsOptions: cors.CorsOptions = {
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'X-Access-Token',
            'Authorization'
        ],

        methods: ['GET', 'OPTIONS', 'PUT', 'POST', 'DELETE'],

        preflightContinue: false,
        origin: function (origin, callback) {
            // allow requests with no origin
            // (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (this.allowedOrigins.indexOf(origin) === -1) {
                var msg = 'The CORS policy for this site does not ' +
                    'allow access from the specified Origin.';
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },

        exposedHeaders: ['Content-Length'],
        credentials: true,
    };


    // Customized Http Metrics (Optional)
    private httpMetricsLabelNames = ['method', 'path'];
    private totalHttpRequestCount = new promClient.Counter({
        name: 'nodejs_http_total_count',
        help: 'total request number',
        labelNames: this.httpMetricsLabelNames
    });
    private httpStatusMetricsLabelNames = ['path', 'status'];
    private totalHttpRequestStatusCount = new promClient.Counter({
        name: 'nodejs_http_status_total_count',
        help: 'total status request number',
        labelNames: this.httpStatusMetricsLabelNames
    });

    private totalHttpRequestDuration = new promClient.Gauge({
        name: 'nodejs_http_total_duration',
        help: 'the last duration or response time of last request',
        labelNames: this.httpMetricsLabelNames
    });

    public app: express.Application = null;
    // private levelController: LevelController;

    constructor() {
        this.init()
        this.app = express()
        // this.app.use(cors(this.corsOptions));
        this.security()
        this.middleware();
        this.routes();
    }

    async init() {
        this.collectDefaultMetrics();
        // Probe every 1 second

        // const Registry = client.Registry;
        // const register = new Registry();
        // const prefix = 'test-node-api';
        // const timeout = 1000;
        // collectDefaultMetrics({ prefix });



        // const cosmosClient = new CosmosClient({
        //     endpoint: this.config.endpoint,
        //     key: this.config.key
        // })
        // const cosmosTest = new CosmosTest(cosmosClient, this.config)
        // this.levelController = new LevelController(cosmosTest)
        // const taskList = new TaskList(taskDao)
        // cosmosTest
        //     .init(err => {
        //         console.error(err)
        //     })
        //     .catch(err => {
        //         console.error(err)
        //         console.error(
        //             'Shutting down because there was an error settinig up the database.'
        //         )
        //         process.exit(1)
        //     })
    }


    // Security

    private security() {

        this.app.use((req: Request, res, next) => {
            const start = process.hrtime()






            res.on('finish', () => {
                console.log(res.statusCode)


                const durationInMilliseconds = this.getDurationInMilliseconds(start)
                this.totalHttpRequestDuration.labels(req.method, req.originalUrl).inc(durationInMilliseconds);
                this.totalHttpRequestCount.labels(req.method, req.originalUrl).inc();
                this.totalHttpRequestStatusCount.labels(req.originalUrl, res.statusCode).inc();
            })
            next()
        })
        this.app.use(cors(this.corsOptions));

        var expiryDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        this.app.use(session({
            name: 'session',
            keys: ['Test1', 'test2'],
            cookie: {
                secure: true,
                httpOnly: true,
                domain: 'discordapi.hoppeh.no',
                path: 'test',
                expires: expiryDate
            }
        }))
        // this.app.use(helmet())

    }

    // Configure Express middleware.
    private middleware(): void {


        // this.totalHttpRequestCount.inc()
        this.app.use(logger('dev'));

        this.app.use(bodyParser.json());

        this.app.use(cookieParser())

    }



    routes() {

        const router = express.Router();





        // enable pre-flight
        // router.options('*', cors(options));
        router.use((req, res, next) => {



            if (req.method === 'OPTIONS') {
                res.send(200);
            } else {
                next();
            }



        });
        // placeholder route handler


        // router.get('/', (req: Request, res: Response, next: NextFunction) => console.log('ShowTasks'))
        // this.app.get('/', (req: Request, res: Response, next: NextFunction) => LevelController.showTasks(req, res).catch(next))
        // router.post('/addtask', (req, res, next) => { console.log('Addtask'); this.levelController.addTask(req, res).catch(next) })
        router.post('/completetask', (req, res, next) => {

            // this.levelController.completeTask(req, res).catch(next)
            res.status(200).message('Tasks completed')
            res.send();
        });


        router.get('/metrics', (req, res) => {
            res.status(200).set('Content-Type', 'text/plain');
            res.end(promClient.register.metrics());
        })


        router.post('/test', (req: Request, res: Response, next: NextFunction) => {
            console.log(req.body)
            let body = '';

            req.on('data', (data) => {
                body += data;
            })

            req.on('end', () => {
                // console.log(body);
                redisDb.insertMessage(`/test-${Date.now()}`, String(`${body}`))
                    .then((dataRes) => {
                        res.status(200).send(dataRes);
                    })
                    .catch(err => { res.status(500).send(err) })
                // this.levelController.completeTask(req, res).catch(next)
            })
        })
        router.use('/', (req, res, next) => {
            res.json({
                message: 'Hello World11111!'
            });
        });

        //Todo this.app:


        this.app.use('/', cors(), router);


        // catch 404 and forward to error handler
        this.app.use(function (req: Request, res: Response, next: NextFunction) {
            const err = new Error('Not Found') as ErrorWithStatus
            err.status = 404
            next(err)
        })

        // error handler
        this.app.use(function (err, req: Request, res: Response, next: NextFunction) {
            // set locals, only providing error in development
            res.locals.message = err.message
            res.locals.error = req.app.get('env') === 'development' ? err : {}

            // render the error page
            res.status(err.status || 500)
            res.send(err)
        })
    }

    getDurationInMilliseconds = (start) => {
        const NS_PER_SEC = 1e9
        const NS_TO_MS = 1e6
        const diff = process.hrtime(start)

        return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS
    }

}



export default new App().app;