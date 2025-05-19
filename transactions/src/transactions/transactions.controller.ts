import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, Transaction } from './transaction.model';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    try {
      return await this.transactionsService.createTransaction(
        createTransactionDto,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  async getTransaction(@Param('id') id: string): Promise<Transaction> {
    const transaction = await this.transactionsService.getTransaction(id);

    if (!transaction) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }

    return transaction;
  }

  @Get()
  async getAllTransactions(): Promise<Transaction[]> {
    return this.transactionsService.getAllTransactions();
  }
}
