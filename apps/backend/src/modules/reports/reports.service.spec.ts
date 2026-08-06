import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let repo: {
    overview: jest.Mock;
    salesByServiceDate: jest.Mock;
    usage: jest.Mock;
    operations: jest.Mock;
    occupancy: jest.Mock;
    scheduleFill: jest.Mock;
  };

  beforeEach(() => {
    repo = {
      overview: jest.fn(),
      salesByServiceDate: jest.fn(),
      usage: jest.fn(),
      operations: jest.fn(),
      occupancy: jest.fn(),
      scheduleFill: jest.fn(),
    };
    service = new ReportsService(repo as never);
  });

  it('pivots sales rows into one point per day', async () => {
    repo.salesByServiceDate.mockResolvedValue([
      { day: '2026-01-01', domain: 'hotel', revenue: 100 },
      { day: '2026-01-01', domain: 'ferry', revenue: 50 },
      { day: '2026-01-02', domain: 'park', revenue: 30 },
    ]);

    const points = await service.sales();

    expect(points).toEqual([
      { date: '2026-01-01', hotel: 100, ferry: 50, park: 0, event: 0 },
      { date: '2026-01-02', hotel: 0, ferry: 0, park: 30, event: 0 },
    ]);
  });

  it('computes utilization as a percentage', async () => {
    repo.usage.mockResolvedValue([
      { domain: 'ferry', capacity: 200, booked: 50 },
      { domain: 'event', capacity: 0, booked: 0 },
    ]);

    const usage = await service.usage();

    expect(usage[0].utilization).toBe(25);
    expect(usage[1].utilization).toBe(0); // guards divide-by-zero
  });

  it('rounds outstanding money to the penny', async () => {
    repo.operations.mockResolvedValue({
      arrivalsToday: 2,
      departuresToday: 1,
      inHouse: 3,
      unassignedRooms: 7,
      pendingPaymentCount: 6,
      // SQLite sums REAL, so a float artefact can reach the service.
      pendingPaymentAmount: 3790.0000000001,
      refundedCount: 2,
      refundedAmount: 3600.005,
    });

    const ops = await service.operations();

    expect(ops.pendingPaymentAmount).toBe(3790);
    expect(ops.refundedAmount).toBe(3600.01);
    expect(ops.unassignedRooms).toBe(7);
  });

  it('derives occupancy from room-nights, guarding empty hotels', async () => {
    repo.occupancy.mockResolvedValue([
      {
        hotelId: 1,
        hotelName: 'Bandos',
        rooms: 4,
        roomNightsBooked: 22.2,
        roomNightsAvailable: 120,
      },
      {
        hotelId: 2,
        hotelName: 'Roomless',
        rooms: 0,
        roomNightsBooked: 0,
        roomNightsAvailable: 0,
      },
    ]);

    const rows = await service.occupancy();

    expect(rows[0].occupancy).toBe(18.5);
    expect(rows[1].occupancy).toBe(0); // no rooms must not divide by zero
  });

  it('converts schedule timestamps to ISO and computes fill rate', async () => {
    repo.scheduleFill.mockResolvedValue([
      {
        domain: 'ferry',
        id: 6,
        label: 'A → B',
        detail: 'Route',
        startAt: 1_785_130_000,
        capacity: 40,
        booked: 5,
      },
      {
        domain: 'event',
        id: 9,
        label: 'Cancelled-out show',
        detail: 'beach',
        startAt: 1_785_130_000,
        capacity: 0,
        booked: 0,
      },
    ]);

    const rows = await service.scheduleFill();

    expect(rows[0].fillRate).toBe(12.5);
    expect(rows[0].startAt).toBe(new Date(1_785_130_000 * 1000).toISOString());
    expect(rows[1].fillRate).toBe(0); // zero-capacity schedule
  });
});
