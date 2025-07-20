# Blockchain API Server

A Node.js backend service for blockchain transaction processing and management using Ethereum blockchain data via Alchemy SDK.

## Features

- **Blockchain Integration**: Real-time Ethereum transaction data via Alchemy SDK
- **Job Queue Processing**: Asynchronous transaction processing using BullMQ and Redis
- **Database Storage**: MongoDB storage for transaction data with efficient indexing
- **RESTful API**: Complete API endpoints for blockchain operations
- **Error Handling**: Comprehensive error handling and logging

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or cloud instance)
- Redis (running locally or cloud instance)
- Alchemy API key

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file and configure your settings:
```bash
cp env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/blockchain_project
REDIS_URL=redis://localhost:6379
ALCHEMY_API_KEY=your_alchemy_api_key_here
ALCHEMY_NETWORK=eth-mainnet
JWT_SECRET=your_jwt_secret_here
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Blockchain Operations
- `GET /api/blockchain/transaction/:hash` - Get transaction by hash
- `GET /api/blockchain/address/:address` - Get transactions by address
- `GET /api/blockchain/transactions/latest` - Get latest transactions
- `GET /api/blockchain/stats` - Get transaction statistics
- `POST /api/blockchain/transaction/process` - Manually process a transaction

## Database Schema

### Transaction Model
```javascript
{
  hash: String (unique, indexed),
  from: String (indexed),
  to: String (indexed),
  value: String,
  gas: String,
  gasPrice: String,
  nonce: Number,
  blockNumber: Number (indexed),
  blockHash: String,
  status: String (enum: 'pending', 'confirmed', 'failed'),
  timestamp: Date,
  network: String
}
```

## Job Queue

The application uses BullMQ for asynchronous transaction processing:

- **Queue**: `transaction-processing`
- **Concurrency**: 5 jobs processed simultaneously
- **Retry Logic**: 3 attempts with exponential backoff
- **Error Handling**: Comprehensive error logging and recovery

## Project Structure

```
backend/
├── config/
│   ├── database.js      # MongoDB connection
│   ├── redis.js         # Redis configuration
│   └── alchemy.js       # Alchemy SDK setup
├── models/
│   └── Transaction.js   # MongoDB transaction model
├── queues/
│   └── transactionQueue.js  # BullMQ job queue
├── routes/
│   └── blockchain.js    # API routes
├── index.js             # Main server file
├── package.json
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/blockchain_project |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `ALCHEMY_API_KEY` | Alchemy API key | Required |
| `ALCHEMY_NETWORK` | Ethereum network | eth-mainnet |
| `JWT_SECRET` | JWT secret for authentication | Required |

## Error Handling

The application includes comprehensive error handling:

- Database connection errors
- API rate limiting
- Invalid transaction hashes
- Network connectivity issues
- Job queue failures

## Monitoring

- Health check endpoint for monitoring
- Detailed logging for debugging
- Job queue status tracking
- Database connection monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License 