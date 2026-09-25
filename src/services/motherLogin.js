import { CK_Dsh_Gujmarg, CK_Dsh_MMGSY } from '../config/api.config';

const STROBES_AUTH = 'https://strobes.in/api/auth/thirdPartyLogin';
const STROBES_POST = 'https://strobes.in/postlogin';

/**
 * Legacy AppHeader handleMotherLinkClick — opens external mother system SSO.
 */
export async function openMotherLogin(targetSystem, loginId) {
  const user = loginId?.trim() || 'sec-rnb';

  if (targetSystem === 'STROBES') {
    const newTab = window.open('about:blank', '_blank');
    try {
      const response = await fetch(STROBES_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thirdparty_username: user }),
      });
      const data = await response.json();
      if (!data?.data || !newTab) {
        newTab?.close();
        return;
      }
      const form = newTab.document.createElement('form');
      form.method = 'POST';
      form.action = STROBES_POST;
      const params = {
        username: data.data.username,
        request_from: 'rnbdashboard.com',
        thirdparty_username: user,
      };
      Object.entries(params).forEach(([k, v]) => {
        const input = newTab.document.createElement('input');
        input.type = 'hidden';
        input.name = k;
        input.value = v;
        form.appendChild(input);
      });
      newTab.document.body.appendChild(form);
      form.submit();
    } catch (e) {
      console.error('Mother login (STROBES) failed', e);
      newTab?.close();
    }
    return;
  }

  if (targetSystem === 'Panchayat') {
    const base = CK_Dsh_MMGSY || 'http://182.72.220.203';
    window.open(
      `${base}/MMGSY_New/DashBoard.aspx?username=${encodeURIComponent(user)}`,
      '_blank',
    );
    return;
  }

  if (targetSystem === 'GujMARG' && CK_Dsh_Gujmarg) {
    window.open(CK_Dsh_Gujmarg, '_blank');
  }
}
