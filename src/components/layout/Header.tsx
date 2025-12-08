import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/jobs': 'Jobs',
  '/applications': 'Applications',
  '/applicants': 'Candidates',
  '/settings': 'Settings',
};

export function Header() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();

  const currentRoute = routeNames[location.pathname] || 'Dashboard';
  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'AD';

  return (
    <header className="glass-panel sticky top-0 z-40 flex h-16 items-center justify-between px-6 lg:pl-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm lg:ml-0 ml-12">
        <span className="text-muted-foreground">Admin</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-foreground">{currentRoute}</span>
      </nav>

      <div className="flex items-center gap-4">
        {/* Create User - Only visible to admins */}
        {isAdmin && <CreateUserDialog />}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary">
            <span className="hidden text-sm font-medium text-foreground sm:block">
              {user?.email}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-foreground text-xs text-background">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">{isAdmin ? 'Administrator' : 'User'}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
