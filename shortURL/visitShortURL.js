/**
 * Retrieve short URL for the purpose of redirecting user to original URL.
 * Should increment visit count by 1.
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

  const shortURL = await this.db.oneOrNone(
    'UPDATE short_urls SET visit_count = visit_count + 1 WHERE id = ${id} RETURNING *',
    { id }
  );

  if (!shortURL) {
    return reply
      .code(404)
      .send({ error: { message: "The short URL doesn't exist" } });
  }

  return reply.code(200).send(formatShortURL(shortURL));
}

export default async (fastify) => {
  fastify.post('/url/:id/visit', { schema }, handler);
};
