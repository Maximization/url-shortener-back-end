import createShortURL from './createShortURL.js';
import getShortURL from './getShortURL.js';
import visitShortURL from './visitShortURL.js';

export default async (fastify) => {
  fastify.register(createShortURL);
  fastify.register(getShortURL);
  fastify.register(visitShortURL);
};
