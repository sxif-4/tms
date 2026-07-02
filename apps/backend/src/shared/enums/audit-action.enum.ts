/**
 * Canonical action strings written to `audit_logs.action`. Extend this as new
 * audited mutations land (ads, promotions, locations, …) so producers and the
 * audit viewer share one vocabulary.
 */
export enum AuditAction {
  UserRoleUpdated = 'user.role_updated',
  UserDeactivated = 'user.deactivated',
}
