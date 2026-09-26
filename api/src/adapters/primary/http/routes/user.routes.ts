import type { FastifyInstance } from 'fastify';
import type { AppContainer } from '@/adapters/primary/http/container.ts';

export async function registerUserRoutes(server: FastifyInstance, container: AppContainer) {
  const { getUserByIdUsecase } = container;

  server.get<{
    Params: { id: string };
  }>(
    '/users/:id',
    { preHandler: [server.requireAuth, server.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params;
      const result = await getUserByIdUsecase.execute(id);
      if (!result.ok) {
        request.log.error(result.error);
        return reply.status(500).send({ error: 'Erreur serveur.' });
      }
      if (!result.value) {
        return reply.status(404).send({ error: 'Utilisateur non trouvé.' });
      }
      return reply.status(200).send(result.value);
    },
  );
}
