import { boardUseCace } from '$/useCase/boardUseCase';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => ({ status: 200, body: boardUseCace.getBoard() }),
  // post: ({ body, user }) => ({ status: 201, body: boardUseCace.clickBoard(body, user.id) }),

  post: async ({ body, user }) => {
    const result = await boardUseCace.clickBoard(body, user.id);
    return { status: 201, body: result };
  },
}));
