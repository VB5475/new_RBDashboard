import axios from 'axios';
import toast from 'react-hot-toast';
import {
  DASHBOARD_URL,
  BASIC_TOKEN_HEADER,
  CHANGE_PASSWORD,
  UPDATE_USER,
  FETCH_USER_DETAILS,
  FETCH_PASSWORD_POLICY,
} from '../config/api.config';
import { getUserToken } from '../utils/session';
import { sanitizeInput } from '../utils/sanitizeInput';

export async function fetchUserDetails() {
  const loginId = getUserToken();
  if (!loginId) return null;

  const params = new URLSearchParams({
    UserCode: loginId,
    LoginID: loginId,
  });
  const response = await axios.get(
    `${DASHBOARD_URL}/${FETCH_USER_DETAILS}?${params}`,
    { headers: BASIC_TOKEN_HEADER },
  );
  const row = response.data?.Table?.[0];
  if (!row) return null;
  return {
    code: String(row.Code ?? '').trim(),
    userName: String(row.UserName ?? '').trim(),
    mobileNo: String(row.MobileNo ?? '').trim(),
  };
}

export async function updateUserDetails({ newUserName, newMobileNo }) {
  const loginId = getUserToken();
  const params = new URLSearchParams({
    UserCode: loginId,
    NewUserName: sanitizeInput(newUserName),
    NewMobileNo: sanitizeInput(newMobileNo),
    LoginID: loginId,
  });
  const response = await axios.get(
    `${DASHBOARD_URL}/${UPDATE_USER}?${params}`,
    { headers: BASIC_TOKEN_HEADER },
  );
  return response.data?.ErrMsg?.[0] ?? null;
}

export async function changePassword({ oldPassword, newPassword }) {
  const loginId = getUserToken();
  const params = new URLSearchParams({
    UserCode: loginId,
    OldPassword: sanitizeInput(oldPassword),
    NewPassword: sanitizeInput(newPassword),
  });
  const response = await axios.get(
    `${DASHBOARD_URL}/${CHANGE_PASSWORD}?${params}`,
    { headers: BASIC_TOKEN_HEADER },
  );
  return response.data?.ErrMsg?.[0] ?? null;
}

function normalizePolicyLinks(data) {
  if (data?.Links?.length) return data.Links;
  if (data?.d?.Links?.length) return data.d.Links;
  if (Array.isArray(data?.Table) && data.Table.length) {
    return data.Table.map((row) => ({
      Key: row.Key ?? row.PP_KEY ?? row.PolicyKey,
      Value: row.Value ?? row.PP_VALUE ?? row.PolicyValue,
    }));
  }
  return [];
}

export function buildPasswordPolicyFromLinks(links = []) {
  const policyMap = {};
  links.forEach((item) => {
    if (item?.Key != null) policyMap[item.Key] = item.Value;
  });

  const yes = (v) => String(v || '').toUpperCase() === 'YES';
  const minLen = parseInt(policyMap.PP1_MIN_TOTAL_LEN || '8', 10);
  const maxLen = parseInt(policyMap.PP1_MAX_TOTAL_LEN || '16', 10);
  const requireUpper = yes(policyMap.PP2_IS_UPPERCASE);
  const requireLower = yes(policyMap.PP2_IS_LOWERCASE);
  const requireNum = yes(policyMap.PP2_IS_NUMBER);
  const requireSpl = yes(policyMap.PP2_IS_SPL_CHAR);

  const minUppercase = requireUpper
    ? parseInt(policyMap.PP2_MIN_LEN_UPPERCASE || '1', 10)
    : 0;
  const minLowercase = requireLower
    ? parseInt(policyMap.PP2_MIN_LEN_LOWERCASE || '1', 10)
    : 0;
  const minNumber = requireNum
    ? parseInt(policyMap.PP2_MIN_LEN_NUMBER || '1', 10)
    : 0;
  const minSpecial = requireSpl
    ? parseInt(policyMap.PP2_MIN_LEN_SPL_CHAR || '1', 10)
    : 0;

  const lookaheads = [];
  if (minUppercase > 0) lookaheads.push(`(?=(?:.*[A-Z]){${minUppercase},})`);
  if (minLowercase > 0) lookaheads.push(`(?=(?:.*[a-z]){${minLowercase},})`);
  if (minNumber > 0) lookaheads.push(`(?=(?:.*\\d){${minNumber},})`);
  if (minSpecial > 0) {
    lookaheads.push(
      `(?=(?:.*[!@#$%^&*()_+\\-=\\[\\]{}|:,.?]){${minSpecial},})`,
    );
  }

  const allowedSet = '[a-zA-Z\\d!@#$%^&*()_+\\-=\\[\\]{}|:,.?]';
  const regex = new RegExp(
    `^${lookaheads.join('')}${allowedSet}{${minLen},${maxLen}}$`,
  );

  return {
    regex,
    constraints: {
      minLen,
      maxLen,
      minUppercase,
      minLowercase,
      minNumber,
      minSpecial,
    },
  };
}

export async function fetchPasswordPolicy(divisionCode) {
  const loginId = getUserToken();
  if (!divisionCode || !loginId) return null;

  const params = new URLSearchParams({
    DivisionCode: divisionCode,
    LoginID: loginId,
  });
  const response = await axios.get(
    `${DASHBOARD_URL}/${FETCH_PASSWORD_POLICY}?${params}`,
    { headers: BASIC_TOKEN_HEADER },
  );
  const links = normalizePolicyLinks(response?.data);
  if (!links.length) return null;
  return buildPasswordPolicyFromLinks(links);
}

const SPECIAL_CHAR_RE = /[!@#$%^&*()_+\-=[\]{}|:,.?]/g;

function countMatches(str, pattern) {
  const m = str.match(pattern);
  return m ? m.length : 0;
}

export function policyRulesForDisplay(constraints) {
  const rules = [
    {
      key: 'length',
      label: `Length: ${constraints.minLen}–${constraints.maxLen} characters`,
      applies: true,
    },
  ];
  if (constraints.minUppercase > 0) {
    rules.push({
      key: 'uppercase',
      label: `At least ${constraints.minUppercase} uppercase letter(s)`,
      applies: true,
    });
  }
  if (constraints.minLowercase > 0) {
    rules.push({
      key: 'lowercase',
      label: `At least ${constraints.minLowercase} lowercase letter(s)`,
      applies: true,
    });
  }
  if (constraints.minNumber > 0) {
    rules.push({
      key: 'number',
      label: `At least ${constraints.minNumber} number(s)`,
      applies: true,
    });
  }
  if (constraints.minSpecial > 0) {
    rules.push({
      key: 'special',
      label: `At least ${constraints.minSpecial} special character(s)`,
      applies: true,
    });
  }
  return rules;
}

export function validatePasswordAgainstPolicy(password, constraints) {
  return {
    length:
      password.length >= constraints.minLen &&
      password.length <= constraints.maxLen,
    uppercase:
      constraints.minUppercase <= 0 ||
      countMatches(password, /[A-Z]/g) >= constraints.minUppercase,
    lowercase:
      constraints.minLowercase <= 0 ||
      countMatches(password, /[a-z]/g) >= constraints.minLowercase,
    number:
      constraints.minNumber <= 0 ||
      countMatches(password, /\d/g) >= constraints.minNumber,
    special:
      constraints.minSpecial <= 0 ||
      countMatches(password, SPECIAL_CHAR_RE) >= constraints.minSpecial,
  };
}

/** Same checks as the UI checklist — use for submit validation. */
export function passwordSatisfiesPolicy(password, policy) {
  const v = validatePasswordAgainstPolicy(password, policy.constraints);
  const rulesOk = policyRulesForDisplay(policy.constraints).every(
    (rule) => v[rule.key],
  );
  return rulesOk && policy.regex.test(password);
}

export function toastApiRow(row) {
  if (!row) {
    toast.error('Unexpected server response');
    return false;
  }
  if (row.ErrCode === '1') {
    toast.success(row.ErrMsg);
    return true;
  }
  toast.error(row.ErrMsg || 'Request failed');
  return false;
}
