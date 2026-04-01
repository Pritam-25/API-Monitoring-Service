import mongoose, { Connection } from 'mongoose';
import config from '@config/index.js';
import logger from '@config/logger.js';

class MongoConnection {
  private connection: Connection | null = null;

  async connect(): Promise<Connection> {
    try {
      if (this.connection) {
        logger.info('MongoDB already connected');
        return this.connection;
      }

      await mongoose.connect(config.mongo.uri, {
        dbName: config.mongo.dbName,
      });

      this.connection = mongoose.connection;

      logger.info(`MongoDB connected successfully.`);

      this.connection.on('error', err => {
        logger.error('MongoDB connection error', err);
      });

      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.connection = null;
        logger.info('MongoDB disconnected!');
      }
    } catch (error) {
      logger.error('Failed to disconnect MongoDB:', error);
      throw error;
    }
  }

  getConnection(): Connection | null {
    return this.connection;
  }
}

export default new MongoConnection();
