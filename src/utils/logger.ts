import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// Añade esta propiedad para compatibilidad con Morgan
logger.stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
} as any;

export { logger };