/**
 * Retrieve short URL for the purpose of redirecting user to original URL.
 * Should increment visit count by 1.
 */

import formatShortURL from '../utils/formatShortURL.js';

const schema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } },
  },
};

async function handler(request, reply) {
  const { id } = request.params;

  const client = await this.pg.connect();
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

export default async (fastify) => {
  fastify.post('/url/:id/visit', { schema }, handler);
};