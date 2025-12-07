import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-medium text-foreground">Account Information</h2>
        </div>
        <div className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value="Administrator"
                disabled
                className="bg-secondary"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="id">User ID</Label>
            <Input
              id="id"
              value={user?.id || ''}
              disabled
              className="font-mono text-xs bg-secondary"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-medium text-foreground">Account Created</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            {user?.created_at 
              ? new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Unknown'}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-destructive/20 bg-card">
        <div className="border-b border-destructive/20 px-6 py-4">
          <h2 className="text-sm font-medium text-destructive">Danger Zone</h2>
        </div>
        <div className="p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="destructive" size="sm" disabled>
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
