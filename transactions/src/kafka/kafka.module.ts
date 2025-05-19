import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { Consumer, Kafka, Producer } from 'kafkajs';

@Module({
  providers: [
    {
      provide: 'KAFKA_CLIENT',
      useFactory: () => {
        return new Kafka({
          clientId: process.env.KAFKA_CLIENT_ID || 'transactions',
          brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        });
      },
    },
    {
      provide: 'KAFKA_PRODUCER',
      useFactory: async (kafka: Kafka) => {
        const producer = kafka.producer();
        await producer.connect();
        return producer;
      },
      inject: ['KAFKA_CLIENT'],
    },
    {
      provide: 'KAFKA_CONSUMER',
      useFactory: async (kafka: Kafka) => {
        const consumer = kafka.consumer({
          groupId: process.env.KAFKA_CONSUMER_GROUP || 'transactions-group',
        });
        await consumer.connect();
        return consumer;
      },
      inject: ['KAFKA_CLIENT'],
    },
  ],
  exports: ['KAFKA_PRODUCER', 'KAFKA_CONSUMER'],
})
export class KafkaModule implements OnModuleDestroy {
  constructor(
    @Inject('KAFKA_PRODUCER') private readonly producer: Producer,
    @Inject('KAFKA_CONSUMER') private readonly consumer: Consumer,
  ) {}

  async onModuleDestroy() {
    if (this.producer) {
      await this.producer.disconnect();
    }
    if (this.consumer) {
      await this.consumer.disconnect();
    }
  }
}
