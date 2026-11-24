import React, { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import { AppConstants } from '../constants';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { logout as logoutAction, setCredentials, updateUser as updateUserAction } from '../redux/slices/authSlice';
import { storageService } from '../services/storageService';
import { UserModel } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserModel | null;
  login: (user: UserModel, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserModel) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => { },
  logout: async () => { },
  updateUser: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state: any) => state.auth);
  const [isLoading, setIsLoading] = React.useState(true);

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
          const restoredUid = String((storedUser as any)?.id || (storedUser as any)?.user_id || '');
          if (restoredUid) {
            await storageService.setItem(AppConstants.storageKeys.uid, restoredUid);
          }
          dispatch(setCredentials({ user: storedUser, token: effectiveToken }));
        }
      } catch (e) {
        console.log('Error restoring session:', e);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, [dispatch]);

  const login = useCallback(async (userData: UserModel, token: string) => {
    const effectiveToken =
      token ||
      (userData as any)?.api_token ||
      (userData as any)?.token ||
      (userData as any)?.auth_token ||
      String(userData.id || (userData as any).user_id || '48');

    const uidValue = String(userData.id || (userData as any).user_id || '');
    await storageService.setItem(AppConstants.storageKeys.token, effectiveToken);
    await storageService.setItem(AppConstants.storageKeys.userData, userData);
    if (uidValue) {
      await storageService.setItem(AppConstants.storageKeys.uid, uidValue);
    }
    dispatch(setCredentials({ user: userData, token: effectiveToken }));
  }, [dispatch]);

  const logout = useCallback(async () => {
    await storageService.removeItem(AppConstants.storageKeys.token);
    await storageService.removeItem(AppConstants.storageKeys.userData);
    await storageService.removeItem(AppConstants.storageKeys.uid);
    dispatch(logoutAction());
  }, [dispatch]);

  const updateUser = useCallback(async (userData: UserModel) => {
    await storageService.setItem(AppConstants.storageKeys.userData, userData);
    dispatch(updateUserAction(userData));
  }, [dispatch]);

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, user, login, logout, updateUser }),
    [isAuthenticated, isLoading, user, login, logout, updateUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
