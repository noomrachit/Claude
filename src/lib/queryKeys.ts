export const queryKeys = {
  boards: (userId: string) => ['boards', userId] as const,
  board: (userId: string, boardId: string) => ['board', userId, boardId] as const,
  content: (boardId: string) => ['board-content', boardId] as const,
  members: (boardId: string) => ['members', boardId] as const,
  invitations: (boardId: string) => ['invitations', boardId] as const,
}
