import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import {
  Transaction,
  TransactionStatus,
} from '../interfaces/transaction.interface';
import * as process from 'node:process';

@Injectable()
export class AntiFraudService implements OnModuleInit {
  private readonly transactionsTopic =
    process.env.TOPIC_TRANSACTIONS || 'transactions';
  private readonly transactionsStatusTopic =
    process.env.TOPIC_TRANSACTIONS_STATUS || 'transactions-status';
  private readonly FRAUD_THRESHOLD = 1000;

  constructor(private readonly kafkaService: KafkaService) {}

  async onModuleInit() {
    await this.subscribeToTransactions();
  }

  private async subscribeToTransactions() {
    await this.kafkaService.subscribe(
      this.transactionsTopic,
      async (transaction: Transaction) => {
        await this.processTransaction(transaction);
      },
    );
    console.log(`Subscribed to ${this.transactionsTopic} topic`);
  }

  private async processTransaction(transaction: Transaction) {
    console.log(`Processing transaction ${transaction.id}`);

    // Check if transaction value exceeds threshold
    const status: 'approved' | 'rejected' =
      transaction.value > this.FRAUD_THRESHOLD ? 'rejected' : 'approved';

    const transactionStatus: TransactionStatus = {
      id: transaction.id,
      status,
    };

    // Publish result to transactions-status topic
    await this.kafkaService.publish(
      this.transactionsStatusTopic,
      transactionStatus,
    );

    console.log(
      `Transaction ${transaction.id} processed with status: ${status}`,
    );
  }
}
