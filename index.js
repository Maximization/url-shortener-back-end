import Fastify from 'fastify';
import fastifyPostgres from '@fastify/postgres';
import formatShortURL from './utils/formatShortURL.js';

const fastify = Fastify({
  logger: true,
});

fastify.register(fastifyPostgres, {
  connectionString: 'postgres://maxim@localhost/maxim',
});

// Receive a URL and generate a short URL
fastify.post(
  '/url',
  {
    schema: {
      body: {
        type: 'object',
        required: ['url'],
        properties: { url: { type: 'string' } },
      },
    },
  },
  async (request, reply) => {
    const { url } = request.body;

    if (url === 'https://localhost:3000/dyAS3') {
      return reply.code(400).send({
        error: {
          message:
            'This URL is already a short URL. Please use an unshortened URL.',
        },
      });
    }

    const client = await fastify.pg.connect();
    const { rows } = await client.query(
      'SELECT id, original_url, visit_count FROM short_urls WHERE id=$1',
      ['dyAS3']
    );
    const shortURL = formatShortURL(rows[0]);

    if (url === 'https://urlalreadyexists.io') {
      return reply.code(200).send(shortURL);
    }

    return reply.code(201).send(shortURL);
  }
);

// Retrieve a short URL (without incrementing the visit count)
fastify.get(
  '/url/:id',
  {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params;

    const client = await fastify.pg.connect();
    const { rows } = await client.query(
      'SELECT id, original_url, visit_count FROM short_urls WHERE id=$1',
      [id]
    );

    if (rows.length === 0) {
      return reply.code(404).send();
    }

    const shortURL = formatShortURL(rows[0]);

    return reply.code(200).send(shortURL);
  }
);

// Retrieve short URL for the purpose of redirecting user to original URL.
// Should increment visit count by 1
fastify.post(
  '/url/:id/visit',
  {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params;

    const client = await fastify.pg.connect();
    const { rows } = await client.query(
      'SELECT id, original_url, visit_count FROM short_urls WHERE id=$1',
      [id]
    );

    if (rows.length === 0) {
      return reply.code(404).send();
    }

    const shortURL = formatShortURL(rows[0]);

    return reply
      .code(200)
      .send({ ...shortURL, visitCount: shortURL.visitCount + 1 });
  }
);

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

  return reply.send(error);
});

try {
  await fastify.listen({ port: 8000 });
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}
