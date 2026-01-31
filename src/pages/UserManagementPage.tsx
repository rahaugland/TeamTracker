import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { usePermissions } from '@/hooks/usePermissions';
import {
  getAllUsers,
  updateUserRole,
  removeUserFromTeam,
  removeCoachFromTeam,
  type UserWithTeams,
} from '@/services/users.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, X, Shield, AlertCircle } from 'lucide-react';
import type { UserRole } from '@/types/database.types';

export function UserManagementPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const permissions = usePermissions();

  const [users, setUsers] = useState<UserWithTeams[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithTeams[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for change role dialog
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    currentRole: UserRole;
    newRole: UserRole | null;
  } | null>(null);

  // State for remove from team dialog
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    type: 'membership' | 'assignment';
    id: string;
    userName: string;
    teamName: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on search and role filter
  useEffect(() => {
    let result = users;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.full_name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(t('common.messages.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!roleChangeDialog || !roleChangeDialog.newRole) return;

    try {
      setIsSubmitting(true);
      await updateUserRole(roleChangeDialog.userId, roleChangeDialog.newRole);
      await loadUsers();
      setRoleChangeDialog(null);
    } catch (err) {
      console.error('Error updating role:', err);
      setError(t('users.roleChangeError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromTeam = async () => {
    if (!removeDialog) return;

    try {
      setIsSubmitting(true);
      if (removeDialog.type === 'membership') {
        await removeUserFromTeam(removeDialog.id);
      } else {
        await removeCoachFromTeam(removeDialog.id);
      }
      await loadUsers();
      setRemoveDialog(null);
    } catch (err) {
      console.error('Error removing from team:', err);
      setError(t('users.removeFromTeamError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'head_coach':
        return 'default';
      case 'assistant_coach':
        return 'secondary';
      case 'player':
        return 'outline';
      case 'parent':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (!permissions.canViewUsers) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('users.noPermission')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('users.title')}</h1>
        </div>
        <p className="text-muted-foreground">{t('users.description')}</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('users.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('users.allRoles')}</SelectItem>
            <SelectItem value="head_coach">{t('users.roles.head_coach')}</SelectItem>
            <SelectItem value="assistant_coach">{t('users.roles.assistant_coach')}</SelectItem>
            <SelectItem value="player">{t('users.roles.player')}</SelectItem>
            <SelectItem value="parent">{t('users.roles.parent')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('common.messages.loading')}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm || roleFilter !== 'all'
            ? t('users.noUsersFound')
            : t('users.noUsers')}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.labels.name')}</TableHead>
                <TableHead>{t('common.labels.email')}</TableHead>
                <TableHead>{t('users.role')}</TableHead>
                <TableHead>{t('users.teams')}</TableHead>
                <TableHead className="text-right">{t('common.labels.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const allTeams = [
                  ...(user.coach_assignments?.map((ca) => ({
                    id: ca.id,
                    name: ca.team.name,
                    seasonName: ca.team.season.name,
                    type: 'coach' as const,
                    role: ca.role,
                  })) || []),
                  ...(user.team_memberships
                    ?.filter((tm) => tm.is_active)
                    .map((tm) => ({
                      id: tm.id,
                      name: tm.team.name,
                      seasonName: tm.team.season.name,
                      type: 'player' as const,
                      role: tm.role,
                    })) || []),
                ];

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {t(`users.roles.${user.role}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {allTeams.length === 0 ? (
                        <span className="text-muted-foreground text-sm">
                          {t('users.noTeams')}
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {allTeams.map((team) => (
                            <div key={team.id} className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {team.name}
                              </Badge>
                              {permissions.canRemoveUsers && user.id !== currentUser?.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={() =>
                                    setRemoveDialog({
                                      open: true,
                                      type: team.type === 'coach' ? 'assignment' : 'membership',
                                      id: team.id,
                                      userName: user.full_name,
                                      teamName: team.name,
                                    })
                                  }
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {permissions.canChangeUserRoles && user.id !== currentUser?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setRoleChangeDialog({
                              open: true,
                              userId: user.id,
                              userName: user.full_name,
                              currentRole: user.role,
                              newRole: null,
                            })
                          }
                        >
                          {t('users.changeRole')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Change Role Dialog */}
      {roleChangeDialog && (
        <Dialog open={roleChangeDialog.open} onOpenChange={(open) => !open && setRoleChangeDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('users.changeRoleTitle')}</DialogTitle>
              <DialogDescription>
                {t('users.changeRoleDescription', { name: roleChangeDialog.userName })}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                {t('users.newRole')}
              </label>
              <Select
                value={roleChangeDialog.newRole || undefined}
                onValueChange={(value) =>
                  setRoleChangeDialog({ ...roleChangeDialog, newRole: value as UserRole })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('users.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="head_coach">{t('users.roles.head_coach')}</SelectItem>
                  <SelectItem value="assistant_coach">{t('users.roles.assistant_coach')}</SelectItem>
                  <SelectItem value="player">{t('users.roles.player')}</SelectItem>
                  <SelectItem value="parent">{t('users.roles.parent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleChangeDialog(null)} disabled={isSubmitting}>
                {t('common.buttons.cancel')}
              </Button>
              <Button
                onClick={handleRoleChange}
                disabled={!roleChangeDialog.newRole || isSubmitting}
              >
                {isSubmitting ? t('common.messages.saving') : t('common.buttons.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Remove from Team Dialog */}
      {removeDialog && (
        <Dialog open={removeDialog.open} onOpenChange={(open) => !open && setRemoveDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('users.removeFromTeamTitle')}</DialogTitle>
              <DialogDescription>
                {t('users.removeFromTeamDescription', {
                  name: removeDialog.userName,
                  team: removeDialog.teamName,
                })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveDialog(null)} disabled={isSubmitting}>
                {t('common.buttons.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleRemoveFromTeam} disabled={isSubmitting}>
                {isSubmitting ? t('common.messages.saving') : t('users.remove')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
