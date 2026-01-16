import { currentUser } from '@clerk/nextjs/server';
import {
  CheckCircle2,
  LayoutDashboard,
  ListTodo,
  Zap,
  Shield,
  Clock,
  Users,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function HomePage() {
  const user = await currentUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(30,42,94,0.18),_transparent_55%),radial-gradient(circle_at_20%_20%,_rgba(244,220,194,0.5),_transparent_45%)]">
      <div
        className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-accent/60 blur-3xl"
        aria-hidden="true"
      />
      {/* Navigation */}
      <nav className="relative border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <ListTodo className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">TaskFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Organize with intention
            </span>
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
              Task management
              <span className="block text-primary">crafted for clarity</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              TaskFlow keeps every project crisp, prioritized, and beautifully in motion. Plan,
              assign, and ship with a space designed for focus.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="font-display mb-4 text-3xl font-semibold sm:text-4xl">
            Everything you need to stay on track
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Thoughtfully designed features help your team stay coordinated, focused, and ahead of
            deadlines.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <LayoutDashboard className="mb-3 h-10 w-10 text-primary" />
              <CardTitle>Editorial Dashboard</CardTitle>
              <CardDescription>
                Scan progress, tasks, and milestones in a single elegant view.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="mb-3 h-10 w-10 text-primary" />
              <CardTitle>Live Momentum</CardTitle>
              <CardDescription>
                Updates sync instantly so your team never misses a beat.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle2 className="mb-3 h-10 w-10 text-primary" />
              <CardTitle>Priority Signals</CardTitle>
              <CardDescription>
                Instantly see what&apos;s urgent, in motion, or ready to close.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="mb-3 h-10 w-10 text-primary" />
              <CardTitle>Team Alignment</CardTitle>
              <CardDescription>
                Assign ownership, share updates, and move together with clarity.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="mb-3 h-10 w-10 text-primary" />
              <CardTitle>Deadline Intelligence</CardTitle>
              <CardDescription>
                Keep every launch in sight with smart reminders and pacing.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="mb-3 h-10 w-10 text-primary" />
              <CardTitle>Secure by Design</CardTitle>
              <CardDescription>
                Enterprise-grade security keeps your work protected.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <Card className="border-primary/40 bg-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-3xl sm:text-4xl">
              Ready to design a calmer workflow?
            </CardTitle>
            <CardDescription className="text-lg">
              Join teams who plan, execute, and deliver with TaskFlow.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Get Started for Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background/70">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 TaskFlow. Built with Next.js, Convex, and Clerk.</p>
        </div>
      </footer>
    </div>
  );
}
