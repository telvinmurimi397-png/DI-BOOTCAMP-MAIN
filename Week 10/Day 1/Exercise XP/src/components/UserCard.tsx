interface UserCardProps {
  name?: string
  age?: number
  role?: string
}

function UserCard({
  name = 'Guest user',
  age = 0,
  role = 'Role not specified',
}: UserCardProps) {
  return (
    <article className="user-card">
      <span className="user-card-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
      <div className="user-card-copy">
        <h4>{name}</h4>
        <p>{age > 0 ? `${age} years old` : 'Age not specified'} <span aria-hidden="true">·</span> {role}</p>
      </div>
      <span className="user-card-arrow" aria-hidden="true">↗</span>
    </article>
  )
}

export default UserCard
