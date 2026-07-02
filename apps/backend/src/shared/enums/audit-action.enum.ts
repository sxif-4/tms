/**
 * Canonical action strings written to `audit_logs.action`. Extend this as new
 * audited mutations land (ads, promotions, locations, …) so producers and the
 * audit viewer share one vocabulary.
 */
export enum AuditAction {
  UserCreated = 'user.created',
  UserRoleUpdated = 'user.role_updated',
  UserActivated = 'user.activated',
  UserDeactivated = 'user.deactivated',
  AdvertisementCreated = 'advertisement.created',
  AdvertisementUpdated = 'advertisement.updated',
  AdvertisementDeleted = 'advertisement.deleted',
  PromotionCreated = 'promotion.created',
  PromotionUpdated = 'promotion.updated',
  PromotionDeleted = 'promotion.deleted',
}
