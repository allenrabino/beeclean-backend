export interface StatsSummary {
  totalMerged: number;
  totalDeleted: number;
  totalExported: number;
  totalBackups: number;
  totalRestored: number;
  recentActions: {
    action: string;
    contactCount: number;
    createdAt: string;
  }[];
}
