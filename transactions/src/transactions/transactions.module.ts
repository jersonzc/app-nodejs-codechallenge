import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { PostgresModule } from '../database/postgres.module';
import { RedisModule } from '../database/redis.module';

@Module({
  imports: [PostgresModule, RedisModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
