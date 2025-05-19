import { Inject, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { createClientPool, RedisClientPoolType } from 'redis';

@Module({
  providers: [
    {
      provide: 'REDIS_CONNECTION',
      useFactory: async () => {
        const logger = new Logger('RedisModule');
        const host = process.env.REDIS_HOST || 'localhost';
        const port = process.env.REDIS_PORT || '6379';
        const pool = createClientPool({
          url: `redis://${host}:${port}`,
        });

        try {
          await pool.connect();
          await pool.ping();
          logger.log('Successfully connected to redis');
        } catch (error) {
          const message = (error as AggregateError).errors.join(' - ');
          logger.error(`Failed to connect to redis: ${message}`);
          throw error;
        }

        return pool;
      },
    },
  ],
  exports: ['REDIS_CONNECTION'],
})
export class RedisModule implements OnModuleDestroy {
  constructor(
    @Inject('REDIS_CONNECTION') private readonly pool: RedisClientPoolType,
  ) {}

  onModuleDestroy() {
    if (this.pool) {
      this.pool.destroy();
    }
  }
}
