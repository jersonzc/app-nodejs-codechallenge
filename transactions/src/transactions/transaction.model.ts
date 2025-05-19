type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface Transaction {
  id: string;
  accountExternalIdDebit: string;
  accountExternalIdCredit: string;
  transferTypeId: number;
  value: number;
  status: TransactionStatus;
}

export interface CreateTransactionDto {
  accountExternalIdDebit: string;
  accountExternalIdCredit: string;
  transferTypeId: number;
  value: number;
}
