import { Link } from 'react-router-dom'

const EFFECTIVE_DATE = 'October 6, 2026'

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-medium uppercase tracking-tight text-ink">{title}</h2>
      <div className="flex flex-col gap-3 text-base font-light leading-relaxed text-ink-muted">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-5 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl font-medium uppercase leading-none tracking-tight text-ink">
          Privacy Policy
        </h1>
        <p className="text-sm text-ink-muted">Effective {EFFECTIVE_DATE}</p>
        <p className="text-base font-light leading-relaxed text-ink-muted">
          Your Inner Voice makes personalized guided meditations. This page explains what information
          we collect, how we use it, and the choices you have.
        </p>
      </header>

      <Section title="What we collect">
        <p>
          <span className="font-medium text-ink">Account information.</span> If you create an account,
          we store your email address. If you sign in with Google, we receive your name, email address
          and profile picture from Google. We do not receive your Google password.
        </p>
        <p>
          <span className="font-medium text-ink">What you tell us when building a meditation.</span> The
          theme you choose, the length, the voice, and anything you type about what&apos;s happening in
          your life. This is used to write your meditation.
        </p>
        <p>
          <span className="font-medium text-ink">Saved meditations.</span> If you save a meditation, we
          store its title, theme, length, voice, date and the audio file in your library.
        </p>
        <p>
          <span className="font-medium text-ink">Your voice (optional).</span> If you choose
          &ldquo;Use My Own Voice,&rdquo; we record a short sample of your voice and use it to create a
          voice model so meditations can be read in your voice. If you&apos;re signed in, we save a
          reference to that voice model to your account so you can reuse it.
        </p>
      </Section>

      <Section title="How we use it">
        <p>
          Only to provide the app: writing and recording your meditations, saving them to your library,
          and keeping you signed in. We do not sell your information, and we do not use it for
          advertising.
        </p>
      </Section>

      <Section title="Services we rely on">
        <p>We use a small number of providers to run the app. They process data on our behalf:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li><span className="text-ink">Anthropic (Claude)</span> writes your meditation script from the theme and details you provide.</li>
          <li><span className="text-ink">ElevenLabs</span> turns the script into audio, and creates your voice model if you record your own voice.</li>
          <li><span className="text-ink">Supabase</span> stores accounts, saved meditations and audio files.</li>
          <li><span className="text-ink">Google</span> handles &ldquo;Continue with Google&rdquo; sign-in, if you use it.</li>
          <li><span className="text-ink">Railway</span> hosts the website and server.</li>
        </ul>
      </Section>

      <Section title="Saved audio">
        <p>
          Saved meditation audio is stored at a long, randomly generated web address. It isn&apos;t
          listed or searchable, but anyone who has the exact address can play the file, so please
          don&apos;t share those links if you want them kept private.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          You can delete any saved meditation from My Meditations at any time. If you&apos;d like your
          account or voice model removed entirely, contact us and we&apos;ll take care of it.
        </p>
      </Section>

      <Section title="Children">
        <p>Your Inner Voice is not intended for children under 13, and we do not knowingly collect their information.</p>
      </Section>

      <Section title="Changes">
        <p>If we change this policy, we&apos;ll update the date at the top of this page.</p>
      </Section>

      <Link to="/" className="self-start text-sm font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline">
        ← Back to home
      </Link>
    </main>
  )
}
