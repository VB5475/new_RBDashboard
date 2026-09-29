const WELCOME_KEY = 'rnb_welcome_dismissed';

export function isWelcomeDismissed() {
  return sessionStorage.getItem(WELCOME_KEY) === '1';
}

export function dismissWelcome() {
  sessionStorage.setItem(WELCOME_KEY, '1');
}
