import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { apiRequest, RequestError } from '../../app/api'
import type { RootState } from '../../app/store'
import { clearSession, updateSession } from '../auth/authSlice'
import type { Comment, Story, User } from '../../../../types/models'

interface StoryInput {
  title: string
  content: string
}

interface StoriesPayload {
  stories: Story[]
}

interface StoryPayload {
  story: Story
}

interface StoriesState {
  items: Story[]
  comments: Record<number, Comment[]>
  status: 'idle' | 'loading' | 'failed'
  error: string | null
}

const initialState: StoriesState = { items: [], comments: {}, status: 'idle', error: null }

function getRequestOptions(getState: () => RootState, dispatch: (action: unknown) => unknown) {
  const token = getState().auth.accessToken
  const update = (session: { accessToken: string; user: User } | null) => {
    if (session) dispatch(updateSession(session))
    else dispatch(clearSession())
  }
  return { token, update }
}

function errorMessage(error: unknown): string {
  return error instanceof RequestError ? error.message : 'The request failed. Please try again.'
}

export const loadStories = createAsyncThunk<Story[], void, { state: RootState; rejectValue: string }>(
  'stories/load',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const { token, update } = getRequestOptions(getState, dispatch)
      return (await apiRequest<StoriesPayload>('/stories', {}, token, update)).stories
    } catch (error) {
      return rejectWithValue(errorMessage(error))
    }
  },
)

export const saveStory = createAsyncThunk<Story, StoryInput, { state: RootState; rejectValue: string }>(
  'stories/save',
  async (input, { getState, dispatch, rejectWithValue }) => {
    try {
      const { token, update } = getRequestOptions(getState, dispatch)
      const { story } = await apiRequest<StoryPayload>('/stories', {
        method: 'POST', body: JSON.stringify(input),
      }, token, update)
      return story
    } catch (error) {
      return rejectWithValue(errorMessage(error))
    }
  },
)

export const editStory = createAsyncThunk<Story, { id: number } & StoryInput, { state: RootState; rejectValue: string }>(
  'stories/edit',
  async ({ id, ...input }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { token, update } = getRequestOptions(getState, dispatch)
      const { story } = await apiRequest<StoryPayload>(`/stories/${id}`, {
        method: 'PATCH', body: JSON.stringify(input),
      }, token, update)
      return story
    } catch (error) {
      return rejectWithValue(errorMessage(error))
    }
  },
)

export const deleteStory = createAsyncThunk<number, number, { state: RootState; rejectValue: string }>(
  'stories/delete',
  async (id, { getState, dispatch, rejectWithValue }) => {
    try {
      const { token, update } = getRequestOptions(getState, dispatch)
      await apiRequest<void>(`/stories/${id}`, { method: 'DELETE' }, token, update)
      return id
    } catch (error) {
      return rejectWithValue(errorMessage(error))
    }
  },
)

export const addContributor = createAsyncThunk<Story, { storyId: number; email: string }, { state: RootState; rejectValue: string }>(
  'stories/addContributor',
  async ({ storyId, email }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { token, update } = getRequestOptions(getState, dispatch)
      const { user } = await apiRequest<{ user: User }>(`/users?email=${encodeURIComponent(email)}`, {}, token, update)
      await apiRequest(`/stories/${storyId}/contributors`, {
        method: 'POST', body: JSON.stringify({ userId: user.id }),
      }, getState().auth.accessToken, update)
      return (await apiRequest<StoryPayload>(`/stories/${storyId}`, {}, getState().auth.accessToken, update)).story
    } catch (error) {
      return rejectWithValue(errorMessage(error))
    }
  },
)

export const removeContributor = createAsyncThunk<
  { storyId: number; contributorId: number },
  { storyId: number; contributorId: number },
  { state: RootState; rejectValue: string }
>(
  'stories/removeContributor',
  async ({ storyId, contributorId }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { token, update } = getRequestOptions(getState, dispatch)
      await apiRequest<void>(`/contributors/${contributorId}`, { method: 'DELETE' }, token, update)
      return { storyId, contributorId }
    } catch (error) {
      return rejectWithValue(errorMessage(error))
    }
  },
)

export const loadComments = createAsyncThunk<{ storyId: number; comments: Comment[] }, number, { state: RootState; rejectValue: string }>(
  'stories/loadComments',
  async (storyId, { getState, dispatch, rejectWithValue }) => {
    try {
      const { token, update } = getRequestOptions(getState, dispatch)
      const result = await apiRequest<{ comments: Comment[] }>(`/stories/${storyId}/comments`, {}, token, update)
      return { storyId, comments: result.comments }
    } catch (error) {
      return rejectWithValue(errorMessage(error))
    }
  },
)

export const postComment = createAsyncThunk<{ storyId: number; comment: Comment }, { storyId: number; content: string }, { state: RootState; rejectValue: string }>(
  'stories/postComment',
  async ({ storyId, content }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { token, update } = getRequestOptions(getState, dispatch)
      const result = await apiRequest<{ comment: Comment }>(`/stories/${storyId}/comments`, {
        method: 'POST', body: JSON.stringify({ content }),
      }, token, update)
      return { storyId, comment: result.comment }
    } catch (error) {
      return rejectWithValue(errorMessage(error))
    }
  },
)

export const editComment = createAsyncThunk<
  { storyId: number; comment: Comment },
  { storyId: number; commentId: number; content: string },
  { state: RootState; rejectValue: string }
>(
  'stories/editComment',
  async ({ storyId, commentId, content }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { token, update } = getRequestOptions(getState, dispatch)
      const result = await apiRequest<{ comment: Comment }>(`/stories/${storyId}/comments/${commentId}`, {
        method: 'PATCH', body: JSON.stringify({ content }),
      }, token, update)
      return { storyId, comment: result.comment }
    } catch (error) {
      return rejectWithValue(errorMessage(error))
    }
  },
)

export const deleteComment = createAsyncThunk<
  { storyId: number; commentId: number },
  { storyId: number; commentId: number },
  { state: RootState; rejectValue: string }
>(
  'stories/deleteComment',
  async ({ storyId, commentId }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { token, update } = getRequestOptions(getState, dispatch)
      await apiRequest<void>(`/stories/${storyId}/comments/${commentId}`, { method: 'DELETE' }, token, update)
      return { storyId, commentId }
    } catch (error) {
      return rejectWithValue(errorMessage(error))
    }
  },
)

export const reactToComment = createAsyncThunk<
  { storyId: number; commentId: number; reactionCount: number; reactedByMe: boolean },
  { storyId: number; commentId: number },
  { state: RootState; rejectValue: string }
>(
  'stories/reactToComment',
  async ({ storyId, commentId }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { token, update } = getRequestOptions(getState, dispatch)
      const result = await apiRequest<{ reactionCount: number; reacted: boolean }>(
        `/stories/${storyId}/comments/${commentId}/reactions`, { method: 'POST' }, token, update,
      )
      return { storyId, commentId, reactionCount: result.reactionCount, reactedByMe: result.reacted }
    } catch (error) {
      return rejectWithValue(errorMessage(error))
    }
  },
)

export const updateCommentsSetting = createAsyncThunk<
  { storyId: number; commentsEnabled: boolean },
  { storyId: number; enabled: boolean },
  { state: RootState; rejectValue: string }
>(
  'stories/updateCommentsSetting',
  async ({ storyId, enabled }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { token, update } = getRequestOptions(getState, dispatch)
      const result = await apiRequest<{ commentsEnabled: boolean }>(`/stories/${storyId}/comments/settings`, {
        method: 'PATCH', body: JSON.stringify({ enabled }),
      }, token, update)
      return { storyId, commentsEnabled: result.commentsEnabled }
    } catch (error) {
      return rejectWithValue(errorMessage(error))
    }
  },
)

const storiesSlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    clearStories(state) {
      state.items = []
      state.comments = {}
      state.error = null
    },
    updateStoryLocally(state, action: PayloadAction<{ id: number; changes: Partial<StoryInput> }>) {
      const story = state.items.find((item) => item.id === action.payload.id)
      if (story) Object.assign(story, action.payload.changes)
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadStories.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(loadStories.fulfilled, (state, action) => { state.status = 'idle'; state.items = action.payload })
      .addCase(loadStories.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload ?? 'Unable to load stories.' })
      .addCase(saveStory.fulfilled, (state, action) => { state.items.unshift(action.payload) })
      .addCase(editStory.fulfilled, (state, action) => {
        const index = state.items.findIndex((story) => story.id === action.payload.id)
        if (index !== -1) state.items[index] = action.payload
      })
      .addCase(deleteStory.fulfilled, (state, action) => {
        state.items = state.items.filter((story) => story.id !== action.payload)
        delete state.comments[action.payload]
      })
      .addCase(addContributor.fulfilled, (state, action) => {
        const index = state.items.findIndex((story) => story.id === action.payload.id)
        if (index !== -1) state.items[index] = action.payload
      })
      .addCase(removeContributor.fulfilled, (state, action) => {
        const story = state.items.find((item) => item.id === action.payload.storyId)
        if (story) story.contributors = story.contributors.filter((person) => person.contributorId !== action.payload.contributorId)
      })
      .addCase(loadComments.fulfilled, (state, action) => { state.comments[action.payload.storyId] = action.payload.comments })
      .addCase(postComment.fulfilled, (state, action) => {
        state.comments[action.payload.storyId] ??= []
        state.comments[action.payload.storyId].push(action.payload.comment)
      })
      .addCase(editComment.fulfilled, (state, action) => {
        const comments = state.comments[action.payload.storyId] ?? []
        const index = comments.findIndex((comment) => comment.id === action.payload.comment.id)
        if (index !== -1) comments[index] = action.payload.comment
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.comments[action.payload.storyId] = (state.comments[action.payload.storyId] ?? [])
          .filter((comment) => comment.id !== action.payload.commentId)
      })
      .addCase(reactToComment.fulfilled, (state, action) => {
        const comment = (state.comments[action.payload.storyId] ?? [])
          .find((item) => item.id === action.payload.commentId)
        if (comment) {
          comment.reactionCount = action.payload.reactionCount
          comment.reactedByMe = action.payload.reactedByMe
        }
      })
      .addCase(updateCommentsSetting.fulfilled, (state, action) => {
        const story = state.items.find((item) => item.id === action.payload.storyId)
        if (story) story.commentsEnabled = action.payload.commentsEnabled
      })
  },
})

export const { clearStories, updateStoryLocally } = storiesSlice.actions
export default storiesSlice.reducer
