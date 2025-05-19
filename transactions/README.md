## Description

Transaction service

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

Copy the `.env.example` file to `.env` to set up environment variables.

```bash
# development
$ pnpm run start
```

## CURLs
### Create transaction
```
curl --location 'http://localhost:3002/transactions' \
--header 'Content-Type: application/json' \
--data '{
    "value": 111,
    "transferTypeId": 93,
    "accountExternalIdDebit": "1234",
    "accountExternalIdCredit": "1234"
}'
```
### Get a transaction
```
curl --location 'http://localhost:3002/transactions/a85dc799-2674-4136-8cf4-8bee9d40f782'
```
### Get transactions
```
curl --location 'http://localhost:3002/transactions'
```
