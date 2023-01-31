import Fastify from 'fastify';
import fastifyPostgres from '@fastify/postgres';
import { customAlphabet } from 'nanoid';
import formatShortURL from './utils/formatShortURL.js';

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  5
);

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
      'SELECT id, original_url, visit_count FROM short_urls WHERE original_url = $1',
      [url]
    );

    if (rows.length !== 0) {
      const shortURL = formatShortURL(rows[0]);
      return reply.code(200).send(shortURL);
    }

    const id = nanoid();
    const { rows: newRows } = await client.query(
      'INSERT INTO short_urls (id, original_url) VALUES ($1, $2) RETURNING *',
      [id, url]
    );

    const newShortURL = formatShortURL(newRows[0]);

    return reply.code(201).send(newShortURL);
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
      'SELECT id, original_url, visit_count FROM short_urls WHERE id = $1',
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
      'UPDATE short_urls SET visit_count = visit_count + 1 WHERE id = $1 RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return reply.code(404).send();
    }

    const shortURL = formatShortURL(rows[0]);

    return reply.code(200).send(shortURL);
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
