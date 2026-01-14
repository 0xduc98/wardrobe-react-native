/**
 * Login Screen
 * Implements email/password authentication
 * 
 * Features:
 * - Email + password input
 * - Form validation
 * - Error handling (401, 400, network errors)
 * - Loading states
 * - Navigation to Register screen
 * - Show/hide password toggle
 */

import type { RootScreenProps } from '@/navigation/types';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeScreen } from '@/components/templates';

import { useAuth } from '@/contexts/AuthContext';
import { Paths } from '@/navigation/paths';
import { useTheme } from '@/theme';

type LoginScreenProps = RootScreenProps<Paths.Login>;

function Login({ navigation }: LoginScreenProps) {
  const { t } = useTranslation();
  const { login, error, clearError, isLoading } = useAuth();

  const {
    backgrounds,
    borders,
    colors,
    fonts,
    gutters,
    layout,
  } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    clearError();
    setValidationError(undefined);

    if (!email.trim()) {
      setValidationError(t('auth.errors.email_required'));
      return false;
    }

    if (!password) {
      setValidationError(t('auth.errors.password_required'));
      return false;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError(t('auth.errors.email_invalid'));
      return false;
    }

    return true;
  };

  /**
   * Handle login submission
   */
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login({ email: email.trim(), password });
      // Navigation handled by auth state change
    } catch {
      // Error already handled by AuthContext
    }
  };

  /**
   * Navigate to register screen
   */
  const handleNavigateToRegister = () => {
    navigation.navigate(Paths.Register);
  };

  const errorMessage = validationError ?? error;

  return (
    <SafeScreen>
      <ScrollView
        contentContainerStyle={[
          gutters.paddingHorizontal_20,
          gutters.paddingTop_48,
          gutters.paddingBottom_32,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[gutters.marginBottom_32]}>
          <Text
            style={[
              fonts.size_34,
              fonts.bold,
              fonts.label,
              gutters.marginBottom_8,
            ]}
          >
            {t('auth.login.title')}
          </Text>
          <Text
            style={[
              fonts.size_17,
              fonts.secondaryLabel,
              { lineHeight: 24 },
            ]}
          >
            {t('auth.login.subtitle')}
          </Text>
        </View>

        {/* Error Message */}
        {errorMessage && (
          <View
            style={[
              gutters.padding_16,
              gutters.marginBottom_24,
              backgrounds.systemRed,
              borders.rounded_12,
            ]}
          >
            <Text
              style={[
                fonts.size_15,
                { color: '#FFFFFF', lineHeight: 20 },
              ]}
            >
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Email Input */}
        <View style={[gutters.marginBottom_16]}>
          <Text
            style={[
              fonts.size_15,
              fonts.label,
              gutters.marginBottom_8,
            ]}
          >
            {t('auth.login.email_label')}
          </Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            editable={!isLoading}
            keyboardType="email-address"
            onChangeText={(text) => {
              setEmail(text);
              clearError();
              setValidationError(undefined);
            }}
            placeholder={t('auth.login.email_placeholder')}
            placeholderTextColor={colors.secondaryLabel}
            style={[
              fonts.size_17,
              gutters.paddingVertical_12,
              gutters.paddingHorizontal_16,
              borders.w_1,
              borders.separator,
              borders.rounded_12,
              backgrounds.secondarySystemBackground,
              { color: colors.label },
            ]}
            testID="email-input"
            value={email}
          />
        </View>

        {/* Password Input */}
        <View style={[gutters.marginBottom_24]}>
          <Text
            style={[
              fonts.size_15,
              fonts.label,
              gutters.marginBottom_8,
            ]}
          >
            {t('auth.login.password_label')}
          </Text>
          <View style={[layout.relative]}>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              editable={!isLoading}
              onChangeText={(text) => {
                setPassword(text);
                clearError();
                setValidationError(undefined);
              }}
              placeholder={t('auth.login.password_placeholder')}
              placeholderTextColor={colors.secondaryLabel}
              secureTextEntry={!showPassword}
              style={[
                fonts.size_17,
                gutters.paddingVertical_12,
                gutters.paddingHorizontal_16,
                { paddingRight: 48 },
                borders.w_1,
                borders.separator,
                borders.rounded_12,
                backgrounds.secondarySystemBackground,
                { color: colors.label },
              ]}
              testID="password-input"
              value={password}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowPassword(!showPassword)}
              style={[
                layout.absolute,
                { right: 16, top: 12 },
              ]}
              testID="toggle-password-button"
            >
              <Text
                style={[
                  fonts.size_15,
                  { color: colors.systemBlue },
                ]}
              >
                {showPassword ? t('auth.hide') : t('auth.show')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isLoading}
          onPress={handleLogin}
          style={[
            {
              backgroundColor: colors.systemBlue,
              borderRadius: 12,
              height: 50,
              minHeight: 44,
              width: '100%',
            },
            gutters.paddingVertical_12,
            gutters.marginBottom_16,
            layout.itemsCenter,
            layout.justifyCenter,
            isLoading && { opacity: 0.6 },
          ]}
          testID="login-button"
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={[
                fonts.size_17,
                fonts.bold,
                { color: '#FFFFFF' },
              ]}
            >
              {t('auth.login.submit')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <View
          style={[
            layout.row,
            layout.justifyCenter,
            layout.itemsCenter,
            gutters.marginTop_8,
          ]}
        >
          <Text
            style={[
              fonts.size_15,
              fonts.secondaryLabel,
            ]}
          >
            {t('auth.login.no_account')}{' '}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isLoading}
            onPress={handleNavigateToRegister}
            testID="navigate-to-register-button"
          >
            <Text
              style={[
                fonts.size_15,
                fonts.bold,
                { color: colors.systemBlue },
              ]}
            >
              {t('auth.login.register_link')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

export default Login;
