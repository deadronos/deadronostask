import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { auth, signIn } from '@/auth';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="relative overflow-hidden">
      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 md:flex-row md:items-center">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Built for focus and flow
          </div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Track today, plan tomorrow, and let Convex do the syncing.
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Taskflow is a realtime task manager built for momentum. Keep your inbox clear, visualize
            projects, and never miss a due date.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {session ? (
              <Button asChild>
                <Link href="/app/today">
                  Open your workspace <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <form
                action={async () => {
                  'use server';
                  await signIn('github');
                }}
              >
                <Button type="submit">
                  Sign in with GitHub <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            )}
            <Button variant="outline" asChild>
              <Link href="#features">See features</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Realtime sync
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              OAuth login
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Vercel ready
            </span>
          </div>
        </div>

        <div className="flex-1">
          <div className="glass rounded-3xl border border-border p-6">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-white/80 p-4">
                <h3 className="text-sm font-semibold">Today</h3>
                <p className="mt-2 text-xs text-muted-foreground">3 tasks due. 2 overdue.</p>
                <div className="mt-3 space-y-2">
                  {['Draft roadmap', 'Client feedback', 'Ship onboarding'].map(task => (
                    <div
                      key={task}
                      className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-xs"
                    >
                      {task}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">Today</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white/80 p-4">
                <h3 className="text-sm font-semibold">Projects</h3>
                <div className="mt-3 grid gap-2 text-xs">
                  {['Launch prep', 'Design refresh', 'Hiring'].map(project => (
                    <div
                      key={project}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      {project}
                      <span className="text-muted-foreground">4 tasks</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Realtime everywhere',
              body: 'Convex keeps every view fresh without refresh buttons.',
            },
            {
              title: 'Flexible planning',
              body: 'Projects, labels, priorities, and due dates keep you organized.',
            },
            {
              title: 'Secure by default',
              body: 'Auth.js and Convex JWTs keep user data isolated.',
            },
          ].map(feature => (
            <div key={feature.title} className="glass rounded-2xl border border-border p-6">
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
