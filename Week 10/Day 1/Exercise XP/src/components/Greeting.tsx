interface GreetingProps {
  name: string
  messageCount: number
}

function Greeting({ name, messageCount }: GreetingProps) {
  return (
    <div className="greeting-content">
      <span className="greeting-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
      <div>
        <p className="greeting-kicker">GOOD TO SEE YOU</p>
        <h4>Hello, {name}!</h4>
        <p className="muted-copy">You have {messageCount} new {messageCount === 1 ? 'message' : 'messages'}.</p>
      </div>
    </div>
  )
}

export default Greeting
