/**
 * Register Screen
 * Implements new user registration with email/password
 * 
 * Features:
 * - Email + password + confirm password inputs
 * - Form validation (email format, password strength, password match)
 * - Error handling (409 email exists, 400 validation, network errors)
 * - Loading states
 * - Navigation to Login screen
 * - Show/hide password toggle
 * - Password strength indicator
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

type RegisterScreenProps = RootScreenProps<Paths.Register>;

function Register({ navigation }: RegisterScreenProps) {
  const { t } = useTranslation();
  const { register, error, clearError, isLoading } = useAuth();

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  /**
   * Calculate password strength
   */
  const MIN_PASSWORD_LENGTH = 8;
  const STRONG_PASSWORD_LENGTH = 10;

  const getPasswordStrength = (): 'medium' | 'strong' | 'weak' | undefined => {
    if (!password) return undefined;

    const length = password.length;
    const hasNumbers = /\d/.test(password);
    const hasLetters = /[A-Za-z]/.test(password);
    const hasSpecialChars = /[!"#$%&()*,.:<>?@^{|}]/.test(password);

    if (length < MIN_PASSWORD_LENGTH) return 'weak';
    if (length >= MIN_PASSWORD_LENGTH && (hasNumbers || hasLetters)) return 'medium';
    if (length >= STRONG_PASSWORD_LENGTH && hasNumbers && hasLetters && hasSpecialChars) {
      return 'strong';
    }

    return 'medium';
  };

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

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError(t('auth.errors.email_invalid'));
      return false;
    }

    if (!password) {
      setValidationError(t('auth.errors.password_required'));
      return false;
    }

    // Password strength check (min 8 characters)
    if (password.length < MIN_PASSWORD_LENGTH) {
      setValidationError(t('auth.errors.password_too_short'));
      return false;
    }

    if (!confirmPassword) {
      setValidationError(t('auth.errors.confirm_password_required'));
      return false;
    }

    // Password match check
    if (password !== confirmPassword) {
      setValidationError(t('auth.errors.passwords_mismatch'));
      return false;
    }

    return true;
  };

  /**
   * Handle registration submission
   */
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await register({ email: email.trim(), password });
      // Navigation handled by auth state change (auto-login after register)
    } catch {
      // Error already handled by AuthContext
    }
  };

  /**
   * Navigate to login screen
   */
  const handleNavigateToLogin = () => {
    navigation.navigate(Paths.Login);
  };

  const errorMessage = validationError ?? error;
  const passwordStrength = getPasswordStrength();

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
            {t('auth.register.title')}
          </Text>
          <Text
            style={[
              fonts.size_17,
              fonts.secondaryLabel,
              { lineHeight: 24 },
            ]}
          >
            {t('auth.register.subtitle')}
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
            {t('auth.register.email_label')}
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
            placeholder={t('auth.register.email_placeholder')}
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
        <View style={[gutters.marginBottom_8]}>
          <Text
            style={[
              fonts.size_15,
              fonts.label,
              gutters.marginBottom_8,
            ]}
          >
            {t('auth.register.password_label')}
          </Text>
          <View style={[layout.relative]}>
            <TextInput
              autoCapitalize="none"
              autoComplete="password-new"
              editable={!isLoading}
              onChangeText={(text) => {
                setPassword(text);
                clearError();
                setValidationError(undefined);
              }}
              placeholder={t('auth.register.password_placeholder')}
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

          {/* Password Strength Indicator */}
          {passwordStrength && (
            <View
              style={[
                layout.row,
                layout.itemsCenter,
                gutters.marginTop_8,
              ]}
            >
              <View
                style={[
                  {
                    borderRadius: 2,
                    height: 4,
                    width: 60,
                  },
                  passwordStrength === 'weak' && {
                    backgroundColor: colors.systemRed,
                  },
                  passwordStrength === 'medium' && {
                    backgroundColor: colors.systemOrange,
                  },
                  passwordStrength === 'strong' && {
                    backgroundColor: colors.systemGreen,
                  },
                ]}
              />
              <Text
                style={[
                  fonts.size_13,
                  gutters.marginLeft_8,
                  passwordStrength === 'weak' && {
                    color: colors.systemRed,
                  },
                  passwordStrength === 'medium' && {
                    color: colors.systemOrange,
                  },
                  passwordStrength === 'strong' && {
                    color: colors.systemGreen,
                  },
                ]}
              >
                {t(`auth.password_strength.${passwordStrength}`)}
              </Text>
            </View>
          )}
        </View>

        {/* Confirm Password Input */}
        <View style={[gutters.marginBottom_24]}>
          <Text
            style={[
              fonts.size_15,
              fonts.label,
              gutters.marginBottom_8,
            ]}
          >
            {t('auth.register.confirm_password_label')}
          </Text>
          <View style={[layout.relative]}>
            <TextInput
              autoCapitalize="none"
              autoComplete="password-new"
              editable={!isLoading}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearError();
                setValidationError(null);
              }}
              placeholder={t('auth.register.confirm_password_placeholder')}
              placeholderTextColor={colors.secondaryLabel}
              secureTextEntry={!showConfirmPassword}
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
              testID="confirm-password-input"
              value={confirmPassword}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={[
                layout.absolute,
                { right: 16, top: 12 },
              ]}
              testID="toggle-confirm-password-button"
            >
              <Text
                style={[
                  fonts.size_15,
                  { color: colors.systemBlue },
                ]}
              >
                {showConfirmPassword ? t('auth.hide') : t('auth.show')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isLoading}
          onPress={handleRegister}
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
          testID="register-button"
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
              {t('auth.register.submit')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
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
            {t('auth.register.has_account')}{' '}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isLoading}
            onPress={handleNavigateToLogin}
            testID="navigate-to-login-button"
          >
            <Text
              style={[
                fonts.size_15,
                fonts.bold,
                { color: colors.systemBlue },
              ]}
            >
              {t('auth.register.login_link')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

export default Register;
