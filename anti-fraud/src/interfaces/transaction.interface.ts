export interface Transaction {
  id: string;
  accountExternalIdDebit: string;
  accountExternalIdCredit: string;
  transferTypeId: number;
  value: number;
  status: string;
}

export interface TransactionStatus {
  id: string;
  status: 'approved' | 'rejected';
}