import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { PublicUser, User } from './types.js'

const usersByEmail = new Map<string, User>()
const usersById = new Map<string, User>()

export function findUserByEmail(email: string): User | undefined {
  return usersByEmail.get(email)
}

export function findUserById(id: string): User | undefined {
  return usersById.get(id)
}

export async function createUser(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const user: User = {
    id: randomUUID(),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
  }

  usersByEmail.set(email, user)
  usersById.set(user.id, user)
  return user
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email }
}

export function updateUserName(user: User, name: string): PublicUser {
  user.name = name
  return toPublicUser(user)
}
