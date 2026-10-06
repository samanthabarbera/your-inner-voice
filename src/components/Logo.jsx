import Starburst from './Starburst'

export default function Logo() {
  return (
    <div className="flex flex-col items-center gap-5" aria-label="Your Inner Voice">
      <Starburst size={72} showLines={false} />
      <h1 className="font-display text-4xl font-medium uppercase leading-none tracking-tight text-ink sm:text-5xl">
        Your Inner Voice
      </h1>
    </div>
  )
}
