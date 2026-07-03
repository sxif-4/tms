import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let repo: {
    overview: jest.Mock;
    salesByServiceDate: jest.Mock;
    usage: jest.Mock;
  };

  beforeEach(() => {
    repo = {
      overview: jest.fn(),
      salesByServiceDate: jest.fn(),
      usage: jest.fn(),
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
});
