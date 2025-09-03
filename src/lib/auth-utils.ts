import type { Session, User } from './auth-types';

/**
 * Admin email address
 */
const ADMIN_EMAIL = 'hfinhk1900@gmail.com';

/**
 * Check if a user is an admin based on email address
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user?.email) return false;
  return user.email === ADMIN_EMAIL;
}

/**
 * Check if a user is a regular user (logged in but not admin)
 */
export function isRegularUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return !isAdmin(user);
}

/**
 * Get the appropriate redirect URL after login based on user role
 */
export function getPostLoginRedirectUrl(user: User | null | undefined): string {
  if (!user) return '/';

  if (isAdmin(user)) {
    return '/dashboard';
  }

  // Regular users go to homepage
  return '/';
}

/**
 * Check if a user can access admin routes
 */
export function canAccessAdmin(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if a user can access dashboard
 */
export function canAccessDashboard(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Get user display role for UI
 */
export function getUserDisplayRole(user: User | null | undefined): string {
  if (!user) return 'Guest';
  if (isAdmin(user)) return 'Administrator';
  return 'User';
}
