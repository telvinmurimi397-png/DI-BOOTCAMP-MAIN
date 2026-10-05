import React from 'react'

class PostList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      posts: [],
      errorMsg: '',
    }
  }

  componentDidMount() {
    fetch('https://jsonplaceholder.typicode.com/posts')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Posts request failed with status ${response.status}`)
        }
        return response.json()
      })
      .then((posts) => this.setState({ posts }))
      .catch((error) => {
        console.error('Unable to load posts:', error)
        this.setState({ errorMsg: 'Posts could not be loaded. Please try again later.' })
      })
  }

  render() {
    const { posts, errorMsg } = this.state

    return (
      <section className="feed-section" aria-labelledby="posts-heading">
        <header className="feed-heading">
          <div>
            <p className="eyebrow">Collection 01</p>
            <h2 id="posts-heading">Recent posts</h2>
          </div>
          <span className="feed-count">{posts.length ? `${posts.length} posts` : 'JSON API'}</span>
        </header>
        {errorMsg ? (
          <p className="feed-message feed-error" role="alert">{errorMsg}</p>
        ) : posts.length === 0 ? (
          <p className="feed-message" role="status">Loading posts...</p>
        ) : (
          <div className="post-grid">
            {posts.map((post) => (
              <article className="post-item" key={post.id}>
                <div className="post-number">{String(post.id).padStart(2, '0')}</div>
                <div>
                  <p className="post-byline">Post {post.id} <span>·</span> User {post.userId}</p>
                  <h3>{post.title}</h3>
                  <p className="post-body">{post.body}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }
}

export default PostList