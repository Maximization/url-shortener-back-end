import Fastify from 'fastify';

const fastify = Fastify({
  logger: true,
});

const MOCK_SHORT_URL = {
  id: 'dyAS3',
  originalURL: 'https://someverylongurlhere.io',
  visitCount: 142,
};

// Receive a URL and generate a short URL
fastify.post('/url', async (request, reply) => {
  const { url } = request.body;

  if (url === 'https://localhost:3000/dyAS3') {
    return reply
      .code(400)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send({
        error: {
          message:
            'This URL is already a short URL. Please use an unshortened URL.',
        },
      });
  }

  if (url === 'https://urlalreadyexists.io') {
    return reply
      .code(200)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(MOCK_SHORT_URL);
  }

  return reply
    .code(201)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(MOCK_SHORT_URL);
});

// Retrieve a short URL (without incrementing the visit count)
fastify.get('/url/:id', async (request, reply) => {
  const { id } = request.params;

  if (id !== 'dyAS3') {
    return reply.code(404).send();
  }

  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(MOCK_SHORT_URL);
});

// Retrieve short URL for the purpose of redirecting user to original URL.
// Should increment visit count by 1
fastify.post('/url/:id/visit', async (request, reply) => {
  const { id } = request.params;

  if (id !== 'dyAS3') {
    return reply.code(404).send();
  }

  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send({ ...MOCK_SHORT_URL, visitCount: MOCK_SHORT_URL.visitCount + 1 });
});

try {
  await fastify.listen({ port: 8000 });
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}
