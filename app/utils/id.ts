import type { ID } from '~/types/camp'

export default {
  createId(): ID {
    return crypto.randomUUID()
  },
}
