import * as dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import fastifyPostgres from '@fastify/postgres';
import shortURL from './shortURL/index.js';

const fastify = Fastify({
  logger:
    process.env.NODE_ENV === 'development'
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        }
      : true,
});

fastify.register(fastifyPostgres, {
  connectionString: process.env.POSTGRES_URI,
});

fastify.register(shortURL);

fastify.setErrorHandler(function (error, request, reply) {
  const {
    error: { statusCode },
  } = { error };

  if (statusCode >= 500) {
    this.log.error(error);
  } else if (statusCode >= 400) {
    this.log.info({ err: error }, 'Validation error');
  } else {
    this.log.error(error);
  }

  if (error.validation) {
    return reply.code(400).send({ error: { message: error.message } });
  }

  return reply
    .code(500)
    .send({ error: { message: 'An unknown error occurred.' } });
});

try {
  await fastify.listen({ port: process.env.PORT });
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}
