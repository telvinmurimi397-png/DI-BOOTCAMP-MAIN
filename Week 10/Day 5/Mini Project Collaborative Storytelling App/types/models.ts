export interface User {
  id: number
  username: string
  email: string
  displayName?: string | null
  bio?: string
  avatarUrl?: string | null
}

export interface Contributor extends User {
  contributorId: number
}

export interface Story {
  id: number
  title: string
  content: string
  author: User
  contributors: Contributor[]
  createdAt: string
  updatedAt: string
  commentsEnabled: boolean
}

export interface Comment {
  id: number
  content: string
  createdAt: string
  author: User
  reactionCount: number
  reactedByMe: boolean
}

export interface StoryVersion {
  id: number
  title: string
  content: string
  createdAt: string
  author: Pick<User, 'id' | 'username' | 'displayName'>
}

export interface ApiError {
  message: string
}
