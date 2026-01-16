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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <ListTodo className="h-6 w-6" />
            <span className="text-xl font-bold">TaskFlow</span>
          </div>
          <div className="flex items-center space-x-4">
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
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Task Management
              <span className="block text-primary">Made Simple</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Organize your work, track your projects, and boost productivity with our
              intuitive task management platform.
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
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Everything you need to stay organized
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Powerful features designed to help you manage tasks efficiently and
            collaborate seamlessly.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <LayoutDashboard className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Intuitive Dashboard</CardTitle>
              <CardDescription>
                Get a bird&apos;s eye view of all your tasks and projects in one place
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Real-time Updates</CardTitle>
              <CardDescription>
                See changes instantly with our real-time synchronization across all devices
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle2 className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Task Prioritization</CardTitle>
              <CardDescription>
                Organize tasks by priority to focus on what matters most
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Work together seamlessly with your team on shared projects
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Deadline Tracking</CardTitle>
              <CardDescription>
                Never miss a deadline with smart reminders and notifications
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Secure & Reliable</CardTitle>
              <CardDescription>
                Your data is protected with enterprise-grade security
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl sm:text-4xl">
              Ready to get organized?
            </CardTitle>
            <CardDescription className="text-lg">
              Join thousands of users who have improved their productivity with TaskFlow
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
      <footer className="border-t bg-muted/20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 TaskFlow. Built with Next.js, Convex, and Clerk.</p>
        </div>
      </footer>
    </div>
  );
}
