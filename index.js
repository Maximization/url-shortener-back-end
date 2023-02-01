import Fastify from 'fastify';
import fastifyPostgres from '@fastify/postgres';
import shortURL from './shortURL/index.js';

const fastify = Fastify({
  logger: true,
});

fastify.register(fastifyPostgres, {
  connectionString: 'postgres://maxim@localhost/maxim',
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
  await fastify.listen({ port: 8000 });
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}
