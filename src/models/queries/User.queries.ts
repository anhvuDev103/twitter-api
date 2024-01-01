export interface LoginWithGoogleQuery {
  code: string;
  scope: string;
  authuser: string;
  prompt: 'none' | 'consent' | 'select_account';
}
