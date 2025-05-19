import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { PostgresModule } from '../database/postgres.module';
import { RedisModule } from '../database/redis.module';
import { KafkaModule } from '../kafka/kafka.module';
import { KafkaService } from '../kafka/kafka.service';

@Module({
  imports: [PostgresModule, RedisModule, KafkaModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, KafkaService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
