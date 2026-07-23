import { PromotionsPage } from "~/features/promotions/pages/promotions-page";

/**
 * Park promotions — the shared promotions module, narrowed to event-targeted
 * campaigns. The API already scopes park staff to those; the filter keeps an
 * admin viewing this page on the same footing.
 */
export function ParkPromotionsPage() {
  return (
    <PromotionsPage
      targetType="event"
      title="Event promotions"
      description="Discount campaigns on rides, shows and beach events."
    />
  );
}
