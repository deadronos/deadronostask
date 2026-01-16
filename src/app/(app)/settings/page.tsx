'use client';

import { UserButton } from '@clerk/nextjs';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold">Settings</h1>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-semibold">Account</h2>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/sign-in" />
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>
    </div>
  );
}
