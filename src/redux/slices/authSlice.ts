import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserModel } from '../../types';

interface AuthState {
    user: UserModel | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state: AuthState,
            action: PayloadAction<{ user: UserModel; token: string }>
        ) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
        },
        updateUser: (state: AuthState, action: PayloadAction<UserModel>) => {
            state.user = { ...state.user, ...action.payload };
        },
        logout: (state: AuthState) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
        },
        setLoading: (state: AuthState, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const { setCredentials, updateUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
