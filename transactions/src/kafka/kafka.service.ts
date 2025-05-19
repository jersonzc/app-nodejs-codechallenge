import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Consumer, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);

  constructor(
    @Inject('KAFKA_PRODUCER') private readonly producer: Producer,
    @Inject('KAFKA_CONSUMER') private readonly consumer: Consumer,
  ) {}

  async onModuleInit() {
    // Subscribe to the transactions-status topic
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: 'transactions-status',
      fromBeginning: true,
    });
  }

  async publish(topic: string, message: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      this.logger.log(`Message published to topic ${topic}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish message to topic ${topic}: ${error.message}`,
      );
      throw error;
    }
  }

  async consumeTransactionsStatus(
    callback: (message: any) => Promise<void>,
  ): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) {
            this.logger.warn('Received message with null value');
            return;
          }
          const parsedMessage = JSON.parse(message.value.toString());
          this.logger.log(
            `Received message from topic ${topic}: ${JSON.stringify(parsedMessage)}`,
          );
          await callback(parsedMessage);
        } catch (error) {
          this.logger.error(`Error processing message: ${error.message}`);
        }
      },
    });
  }
}
