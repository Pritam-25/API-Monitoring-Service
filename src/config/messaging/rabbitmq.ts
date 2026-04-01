import amqp from 'amqplib';
import type { Channel, ChannelModel, ConfirmChannel } from 'amqplib';
import config from '@config/index.js';
import logger from '@config/logger.js';

type RabbitChannel = Channel | ConfirmChannel;

class RabbitMQConnection {
	private connection: ChannelModel | null;
	private channel: RabbitChannel | null;
	private isConnecting: boolean;

	constructor() {
		this.connection = null;
		this.channel = null;
		this.isConnecting = false;
	}

	async connect(): Promise<RabbitChannel | null> {
		if (this.channel) {
			return this.channel;
		}

		if (this.isConnecting) {
			await new Promise<void>((resolve) => {
				const checkInterval = setInterval(() => {
					if (!this.isConnecting) {
						clearInterval(checkInterval);
						resolve();
					}
				}, 100);
			});

			return this.channel;
		}

		try {
			this.isConnecting = true;

			logger.info({ url: config.rabbitmq.url }, 'Connecting to RabbitMQ');
			const connection = await amqp.connect(config.rabbitmq.url);
			this.connection = connection;

			const channel = config.rabbitmq.publisherConfirms
				? await connection.createConfirmChannel()
				: await connection.createChannel();
			this.channel = channel;

			const dlqName = `${config.rabbitmq.queue}.dlq`;

			await channel.assertQueue(dlqName, {
				durable: true,
			});

			await channel.assertQueue(config.rabbitmq.queue, {
				durable: true,
				arguments: {
					'x-dead-letter-exchange': '',
					'x-dead-letter-routing-key': dlqName,
				},
			});

			logger.info({ queue: config.rabbitmq.queue }, 'RabbitMQ connected');

			connection.on('close', () => {
				logger.warn('RabbitMQ connection closed');
				this.connection = null;
				this.channel = null;
			});

			connection.on('error', (err) => {
				logger.error({ err }, 'RabbitMQ connection error');
				this.connection = null;
				this.channel = null;
			});

			this.isConnecting = false;
			return this.channel;
		} catch (error) {
			this.isConnecting = false;
			logger.error({ err: error }, 'Failed to connect to RabbitMQ');
			throw error;
		}
	}

	getChannel(): RabbitChannel | null {
		return this.channel;
	}

	getStatus(): 'disconnected' | 'closing' | 'connected' {
		if (!this.connection || !this.channel) return 'disconnected';
		if ((this.connection as { closing?: boolean }).closing) return 'closing';
		return 'connected';
	}

	async close(): Promise<void> {
		try {
			if (this.channel) {
				await this.channel.close();
				this.channel = null;
			}

			if (this.connection) {
				await this.connection.close();
				this.connection = null;
			}

			logger.info('RabbitMQ connection closed');
		} catch (error) {
			logger.error({ err: error }, 'Error closing RabbitMQ connection');
		}
	}
}

export default new RabbitMQConnection();
