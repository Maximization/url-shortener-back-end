/**
 * Receive a URL and generate a short URL
 */

import { customAlphabet } from 'nanoid';
import formatShortURL from '../helpers/formatShortURL.js';

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', // base62
  5
);

const schema = {
  body: {
    type: 'object',
    required: ['url'],
    properties: { url: { type: 'string' } },
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
    '2xx': {
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
  const { url } = request.body;

  const { hostname } = new URL(url);
  const clientHostname = request.hostname.includes(':')
    ? request.hostname.split(':')[0]
    : request.hostname;

  if (hostname === clientHostname) {
    return reply.code(400).send({
      error: {
        message:
          'This URL is already a short URL. Please use an unshortened URL.',
      },
    });
  }

  const shortURL = await this.db.oneOrNone(
    'SELECT id, original_url, visit_count FROM short_urls WHERE original_url = $1',
    [url]
  );

  if (shortURL) {
    return reply.code(200).send(formatShortURL(shortURL));
  }

  const id = nanoid();
  const newShortURL = await this.db.one(
    'INSERT INTO short_urls (id, original_url) VALUES ($1, $2) RETURNING *',
    [id, url]
  );

  return reply.code(201).send(formatShortURL(newShortURL));
}

export default async (fastify) => {
  fastify.post('/url', { schema }, handler);
};
