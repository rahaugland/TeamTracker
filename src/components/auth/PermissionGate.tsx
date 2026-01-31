import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  children: ReactNode;
  permission: keyof ReturnType<typeof usePermissions>;
  fallback?: ReactNode;
}

/**
 * PermissionGate component
 * Conditionally renders children based on user permissions
 *
 * Usage:
 * <PermissionGate permission="canCreateTeam">
 *   <Button>Create Team</Button>
 * </PermissionGate>
 */
export function PermissionGate({ children, permission, fallback = null }: PermissionGateProps) {
  const permissions = usePermissions();

  const hasPermission = permissions[permission];

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
