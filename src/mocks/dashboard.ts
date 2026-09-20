import type { DashboardMetric, ProtectedPurchase } from '../types/purchase';

export const demoProtectedPurchases: ProtectedPurchase[] = [
  {
    id: 'purchase_001',
    merchant: 'Auralab',
    product: 'Studio ANC Headphones',
    amountLabel: '€249.00',
    nextDeadlineLabel: 'Return window · 6 days',
    status: 'attention',
  },
  {
    id: 'purchase_002',
    merchant: 'Monolith',
    product: 'Carry System 02',
    amountLabel: '€118.00',
    nextDeadlineLabel: 'Warranty · 17 months',
    status: 'protected',
  },
];

export const demoDashboardMetrics: DashboardMetric[] = [
  { id: 'protected', label: 'Purchases protected', value: '3', icon: 'shield' },
  { id: 'value', label: 'Value monitored', value: '€556', icon: 'value' },
  { id: 'deadlines', label: 'Deadlines caught', value: '7', icon: 'deadline' },
  { id: 'recovered', label: 'Money recovered', value: '€126', icon: 'recovered' },
];
