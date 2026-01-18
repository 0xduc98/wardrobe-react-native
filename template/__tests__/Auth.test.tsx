import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import ApplicationNavigator from '@/navigation/Application';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthApi } from '@/services/authApi';
import { SecureStorage } from '@/services/secureStorage';
import TestAppWrapper from '@/tests/TestAppWrapper';
import fr from '../src/translations/fr-FR.json';

// Ensure mocks are reset before each test
jest.mock('@/services/authApi');
jest.mock('@/services/secureStorage');

describe('Authentication Flow', () => {
    let mockAuthApi: any;
    let mockSecureStorage: any;

    const renderApp = () => {
        return render(
            <TestAppWrapper>
                <AuthProvider>
                    <ApplicationNavigator />
                </AuthProvider>
            </TestAppWrapper>
        );
    };

    const navigateToRegister = async () => {
        renderApp();
        const registerLink = await screen.findByTestId('navigate-to-register-button');
        fireEvent.press(registerLink);
        await screen.findByText(fr.boilerplate.auth.register.title);
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockAuthApi = AuthApi as jest.Mocked<typeof AuthApi>;
        mockSecureStorage = SecureStorage as jest.Mocked<typeof SecureStorage>;

        // Default mock implementations
        (AuthApi.login as jest.Mock).mockResolvedValue({ accessToken: 'fake-token', refreshToken: 'fake-refresh' });
        (AuthApi.register as jest.Mock).mockResolvedValue({
            user: { id: 1, email: 'test@example.com', name: 'Test User' },
            tokens: { accessToken: 'fake-token', refreshToken: 'fake-refresh' }
        });
        (AuthApi.getCurrentUser as jest.Mock).mockResolvedValue({ id: 1, email: 'test@example.com', name: 'Test User' });
        (SecureStorage.saveTokens as jest.Mock).mockResolvedValue(true);
        (SecureStorage.getTokens as jest.Mock).mockResolvedValue(null);
    });

    describe('Login Screen', () => {
        it('renders login screen', async () => {
            renderApp();
            expect(await screen.findByText(fr.boilerplate.auth.login.title)).toBeTruthy();
            expect(await screen.findByPlaceholderText(fr.boilerplate.auth.login.email_placeholder)).toBeTruthy();
        });

        it('shows error on empty fields', async () => {
            renderApp();
            const loginButton = await screen.findByTestId('login-button');
            fireEvent.press(loginButton);

            // Assuming errors use these keys/values
            expect(await screen.findByText(fr.boilerplate.auth.errors.email_required)).toBeTruthy();
        });

        it('handles successful login', async () => {
            renderApp();

            const emailInput = await screen.findByTestId('email-input');
            fireEvent.changeText(emailInput, 'test@example.com');
            fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
            fireEvent.press(screen.getByTestId('login-button'));

            await waitFor(() => {
                expect(AuthApi.login).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    password: 'password123'
                });
            });
            await waitFor(() => {
                expect(AuthApi.getCurrentUser).toHaveBeenCalled();
            });
        });
    });

    describe('Register Screen', () => {
        it('navigates to register screen', async () => {
            await navigateToRegister();
            expect(await screen.findByText(fr.boilerplate.auth.register.title)).toBeTruthy();
            expect(screen.getByTestId('email-input')).toBeTruthy();
            expect(screen.getByTestId('password-input')).toBeTruthy();
            expect(screen.getByTestId('confirm-password-input')).toBeTruthy();
        });

        it('validates password mismatch', async () => {
            await navigateToRegister();

            fireEvent.changeText(screen.getByTestId('email-input'), 'new@example.com');
            fireEvent.changeText(screen.getByTestId('password-input'), 'Password123!');
            fireEvent.changeText(screen.getByTestId('confirm-password-input'), 'Mismatch123!');

            fireEvent.press(screen.getByTestId('register-button'));

            expect(await screen.findByText(fr.boilerplate.auth.errors.passwords_mismatch)).toBeTruthy();
        });

        it('handles successful registration', async () => {
            await navigateToRegister();

            fireEvent.changeText(screen.getByTestId('email-input'), 'new@example.com');
            fireEvent.changeText(screen.getByTestId('password-input'), 'StrongPass123!');
            fireEvent.changeText(screen.getByTestId('confirm-password-input'), 'StrongPass123!');

            fireEvent.press(screen.getByTestId('register-button'));

            await waitFor(() => {
                expect(AuthApi.register).toHaveBeenCalledWith({
                    email: 'new@example.com',
                    password: 'StrongPass123!',
                });
            });

            // Auto-login check
            await waitFor(() => {
                expect(AuthApi.login).toHaveBeenCalled();
            });
        });

        it('handles registration error (e.g. email exists)', async () => {
            await navigateToRegister();

            // Mock API error
            const errorMock = new Error('Request failed');
            // @ts-ignore
            errorMock.response = {
                status: 409,
                json: async () => ({ message: 'Email already registered' })
            };

            (AuthApi.register as jest.Mock).mockRejectedValue(errorMock);

            fireEvent.changeText(screen.getByTestId('email-input'), 'duplicate@example.com');
            fireEvent.changeText(screen.getByTestId('password-input'), 'StrongPass123!');
            fireEvent.changeText(screen.getByTestId('confirm-password-input'), 'StrongPass123!');

            fireEvent.press(screen.getByTestId('register-button'));

            expect(await screen.findByText(/Email already registered/i)).toBeTruthy();
        });
    });
});
