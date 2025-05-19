import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { KafkaService } from '../kafka/kafka.service';
import {
  CreateTransactionDto,
  Transaction,
  TransactionStatusDto,
} from './transaction.model';

@Injectable()
export class TransactionsService implements OnModuleInit {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @Inject('POSTGRES_CONNECTION') private readonly pgPool: Pool,
    @Inject('REDIS_CONNECTION') private readonly redisClient: RedisClientType,
    private readonly kafkaService: KafkaService,
  ) {}

  async onModuleInit() {
    // Initialize Postgres table if it doesn't exist
    await this.initializePostgresTable();

    // Subscribe to Kafka transactions-status topic
    this.kafkaService.consumeTransactionsStatus(
      this.updateTransactionStatus.bind(this),
    );
  }

  private async initializePostgresTable(): Promise<void> {
    try {
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY,
          account_external_id_debit VARCHAR(255) NOT NULL,
          account_external_id_credit VARCHAR(255) NOT NULL,
          transfer_type_id INTEGER NOT NULL,
          value NUMERIC(15, 2) NOT NULL,
          status VARCHAR(10) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      this.logger.log('Postgres table initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Postgres table: ${error.message}`,
      );
      throw error;
    }
  }

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const validTransferTypes = [1, 93, 94, 95];
    if (!validTransferTypes.includes(createTransactionDto.transferTypeId)) {
      throw new Error('Invalid transferTypeId. Must be one of: 1, 93, 94, 95');
    }

    try {
      const transaction: Transaction = {
        ...createTransactionDto,
        id: uuidv4(),
        status: 'pending',
      };

      // Save to PostgreSQL
      await this.pgPool.query(
        `
        INSERT INTO transactions 
        (id, account_external_id_debit, account_external_id_credit, transfer_type_id, value, status) 
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          transaction.id,
          transaction.accountExternalIdDebit,
          transaction.accountExternalIdCredit,
          transaction.transferTypeId,
          transaction.value,
          transaction.status,
        ],
      );

      // Save to Redis
      await this.redisClient.sAdd('transactions', transaction.id);
      await this.redisClient.set(
        `transaction:${transaction.id}`,
        JSON.stringify(transaction),
      );

      // Publish to Kafka
      await this.kafkaService.publish('transactions', transaction);

      this.logger.log(`Transaction created with ID: ${transaction.id}`);
      return transaction;
    } catch (error) {
      this.logger.error(`Failed to create transaction: ${error.message}`);
      throw error;
    }
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    try {
      // Read from Redis
      const redisTransactionStr = await this.redisClient.get(
        `transaction:${id}`,
      );
      if (redisTransactionStr) {
        return JSON.parse(redisTransactionStr) as Transaction;
      }

      // If not found in Redis, read from PostgreSQL
      const result = await this.pgPool.query(
        `
        SELECT * FROM transactions WHERE id = $1
        `,
        [id],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const transaction: Transaction = {
        id: row.id,
        accountExternalIdDebit: row.account_external_id_debit,
        accountExternalIdCredit: row.account_external_id_credit,
        transferTypeId: row.transfer_type_id,
        value: parseFloat(row.value),
        status: row.status,
      };

      // Store in Redis for future requests
      await this.redisClient.set(
        `transaction:${id}`,
        JSON.stringify(transaction),
      );
      await this.redisClient.sAdd('transactions', id);

      return transaction;
    } catch (error) {
      this.logger.error(`Failed to get transaction ${id}: ${error.message}`);
      throw error;
    }
  }

  async updateTransactionStatus(
    statusUpdate: TransactionStatusDto,
  ): Promise<void> {
    try {
      const { id, status } = statusUpdate;

      // Update in PostgreSQL
      const pgResult = await this.pgPool.query(
        `
        UPDATE transactions 
        SET status = $1 
        WHERE id = $2
        RETURNING *
        `,
        [status, id],
      );

      if (pgResult.rows.length === 0) {
        this.logger.warn(`Transaction ${id} not found for status update`);
        return;
      }

      // Update in Redis
      const exists = await this.redisClient.exists(`transaction:${id}`);
      if (exists) {
        const transactionStr = await this.redisClient.get(`transaction:${id}`);
        if (transactionStr) {
          const transaction = JSON.parse(transactionStr);
          transaction.status = status;
          await this.redisClient.set(
            `transaction:${id}`,
            JSON.stringify(transaction),
          );
        }
      }

      this.logger.log(`Transaction ${id} status updated to ${status}`);
    } catch (error) {
      this.logger.error(
        `Failed to update transaction status: ${error.message}`,
      );
      throw error;
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const result = await this.pgPool.query('SELECT * FROM transactions');
      return result.rows.map((row) => ({
        id: row.id,
        accountExternalIdDebit: row.account_external_id_debit,
        accountExternalIdCredit: row.account_external_id_credit,
        transferTypeId: row.transfer_type_id,
        value: parseFloat(row.value),
        status: row.status,
      }));
    } catch (error) {
      this.logger.error(`Failed to get all transactions: ${error.message}`);
      throw error;
    }
  }
}
