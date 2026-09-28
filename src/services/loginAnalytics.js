import axios from 'axios';
import { DASHBOARD_URL, USER_VISIT_COUNT, BASIC_TOKEN_HEADER } from '../config/api.config';

export const USER_ACTIVITY_METRICS = [
  {
    displayLabel: 'Total Users',
    tone: 'green',
    combinedUserKeys: ['Total Department Users', 'Total Contractor Users'],
  },
  { displayLabel: 'Total Visits (Daily)', apiLabel: 'Daily Count', tone: 'primary' },
  { displayLabel: 'Total Visits (Weekly)', apiLabel: 'Weekly Count', tone: 'amber' },
  { displayLabel: 'Total Visits (Monthly)', apiLabel: 'Monthly Count', tone: 'secondary' },
];

function metricValue(row, spec) {
  if (spec.combinedUserKeys) {
    return spec.combinedUserKeys.reduce(
      (sum, key) => sum + (Number(row[key]) || 0),
      0,
    );
  }
  return Number(row[spec.apiLabel]) || 0;
}

export async function fetchUserVisitStats() {
  try {
    const params = new URLSearchParams({ ModuleCode: '' });
    const result = await axios.get(`${DASHBOARD_URL}/${USER_VISIT_COUNT}?${params}`, {
      headers: BASIC_TOKEN_HEADER,
    });
    const row = result?.data?.Links?.[0];
    if (!row) return null;

    const metrics = USER_ACTIVITY_METRICS.map((spec) => ({
      label: spec.displayLabel,
      value: metricValue(row, spec),
      tone: spec.tone,
    }));

    return { metrics };
  } catch {
    return null;
  }
}
