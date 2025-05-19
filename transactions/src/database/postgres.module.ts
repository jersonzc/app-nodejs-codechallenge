import { Inject, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Module({
  providers: [
    {
      provide: 'POSTGRES_CONNECTION',
      useFactory: async () => {
        const logger = new Logger('PostgresModule');
        const pool = new Pool({
          host: process.env.POSTGRES_HOST || 'localhost',
          port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
          user: process.env.POSTGRES_USER || 'jerson',
          password: process.env.POSTGRES_PASSWORD || 'Aa123456',
          database: process.env.POSTGRES_DATABASE || 'transactions',
        });

        try {
          await pool.query('SELECT NOW()');
          logger.log('Successfully connected to postgres');
        } catch (error) {
          const message = (error as AggregateError).errors.join(' - ');
          logger.error(`Failed to connect to postgres: ${message}`);
          throw error;
        }

        return pool;
      },
    },
  ],
  exports: ['POSTGRES_CONNECTION'],
})
export class PostgresModule implements OnModuleDestroy {
  constructor(@Inject('POSTGRES_CONNECTION') private readonly pool: Pool) {}

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
