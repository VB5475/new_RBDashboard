import axios from 'axios';
import { DASHBOARD_URL, USER_VISIT_COUNT, BASIC_TOKEN_HEADER } from '../config/api.config';

export async function fetchUserVisitStats() {
  try {
    const params = new URLSearchParams({ ModuleCode: '' });
    const result = await axios.get(`${DASHBOARD_URL}/${USER_VISIT_COUNT}?${params}`, {
      headers: BASIC_TOKEN_HEADER,
    });
    const stats = result?.data?.Links?.[0];
    if (!stats) return null;

    const totalDept = stats['Total Department Users'] || 0;
    const totalCont = stats['Total Contractor Users'] || 0;

    return {
      totalUsers: totalDept + totalCont,
      todayActive: stats['Daily Count'] || 0,
      thisWeekActive: stats['Weekly Count'] || 0,
      thisMonthActive: stats['Monthly Count'] || 0,
    };
  } catch {
    return null;
  }
}
