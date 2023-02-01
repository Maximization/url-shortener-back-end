/**
 * Retrieve a short URL (without incrementing the visit count)
 */

import formatShortURL from '../helpers/formatShortURL.js';

const schema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } },
  },
  response: {
    default: {
      type: 'object',
      properties: {
        error: {
          type: 'object',
          required: ['message'],
          properties: { message: { type: 'string' } },
        },
      },
    },
    200: {
      type: 'object',
      required: ['id', 'originalURL', 'visitCount'],
      properties: {
        id: { type: 'string' },
        originalURL: { type: 'string' },
        visitCount: { type: 'number' },
      },
    },
  },
};

async function handler(request, reply) {
  const { id } = request.params;

  const client = await this.pg.connect();
  const { rows } = await client.query(
    'SELECT id, original_url, visit_count FROM short_urls WHERE id = $1',
    [id]
  );

  if (rows.length === 0) {
    return reply
      .code(404)
      .send({ error: { message: "The short URL doesn't exist" } });
  }

  const shortURL = formatShortURL(rows[0]);

  return reply.code(200).send(shortURL);
}

export default async (fastify) => {
  fastify.get('/url/:id', { schema }, handler);
};
