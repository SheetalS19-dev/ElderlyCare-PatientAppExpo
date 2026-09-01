import React, { createContext, ReactNode, useContext } from 'react';
import { AppConstants } from '../constants';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { logout as logoutAction, setCredentials, updateUser as updateUserAction } from '../redux/slices/authSlice';
import { storageService } from '../services/storageService';
import { UserModel } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserModel | null;
  login: (user: UserModel, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserModel) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => { },
  logout: async () => { },
  updateUser: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state: any) => state.auth);

  React.useEffect(() => {
    const restoreSession = async () => {
      try {
        let storedToken = await storageService.getItem<string>(AppConstants.storageKeys.token);
        const storedUser = await storageService.getItem<UserModel>(AppConstants.storageKeys.userData);

        if (storedUser) {
          const effectiveToken =
            storedToken ||
            (storedUser as any)?.api_token ||
            (storedUser as any)?.token ||
            (storedUser as any)?.auth_token ||
            String(storedUser.id || (storedUser as any).user_id || '48');

          if (!storedToken) {
            await storageService.setItem(AppConstants.storageKeys.token, effectiveToken);
          }
          dispatch(setCredentials({ user: storedUser, token: effectiveToken }));
        }
      } catch (e) {
        console.log('Error restoring session:', e);
      }
    };
    restoreSession();
  }, [dispatch]);

  const login = async (userData: UserModel, token: string) => {
    const effectiveToken =
      token ||
      (userData as any)?.api_token ||
      (userData as any)?.token ||
      (userData as any)?.auth_token ||
      String(userData.id || (userData as any).user_id || '48');

    await storageService.setItem(AppConstants.storageKeys.token, effectiveToken);
    await storageService.setItem(AppConstants.storageKeys.userData, userData);
    dispatch(setCredentials({ user: userData, token: effectiveToken }));
  };

  const logout = async () => {
    await storageService.removeItem(AppConstants.storageKeys.token);
    await storageService.removeItem(AppConstants.storageKeys.userData);
    dispatch(logoutAction());
  };

  const updateUser = async (userData: UserModel) => {
    await storageService.setItem(AppConstants.storageKeys.userData, userData);
    dispatch(updateUserAction(userData));
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
