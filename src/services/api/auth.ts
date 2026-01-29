import { apiFetch } from './fetch';

export interface SetupPasswordInput {
  password: string;
}

export const authApi = {
  updatePassword: async (password: string, token: string | null = null): Promise<void> => {
    await apiFetch('/auth/setup-password', token, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    });
  },
};
