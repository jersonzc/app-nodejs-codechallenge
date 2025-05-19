import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'anti-fraud-service',
      brokers: ['localhost:9092'],
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({
      groupId: 'anti-fraud-consumer-group',
    });
  }

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }

  async subscribe(topic: string, callback: (message: any) => Promise<void>) {
    await this.consumer.subscribe({ topic, fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (message.value) {
            const parsedMessage = JSON.parse(message.value.toString());
            await callback(parsedMessage);
          }
        } catch (error) {
          console.error(`Error processing message: ${error.message}`, error);
        }
      },
    });
  }

  async publish(topic: string, message: any) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }
}
