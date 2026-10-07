import type { ID } from '~/types/camp'

export function createId(): ID {
  return crypto.randomUUID()
}
