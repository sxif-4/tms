export interface AuditLog {
  id: number;
  action: string;
  subjectType: string;
  subjectId: number;
  metadata: Record<string, string | number | boolean | null> | null;
  createdAt: string;
  userId: number;
  userName: string;
  userEmail: string;
}

export interface AuditLogPage {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}
