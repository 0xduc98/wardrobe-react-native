import type { RootStackParamList } from '@/navigation/types';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { Paths } from '@/navigation/paths';
import { useTheme } from '@/theme';

import {
  Chat,
  Example,
  Home,
  Login,
  Register,
  Startup,
  TestDetectionScreen,
} from '@/screens';

const Stack = createStackNavigator<RootStackParamList>();

function ApplicationNavigator() {
  const { navigationTheme, variant } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator key={variant} screenOptions={{ headerShown: false }}>
          {isLoading ? (
            // Show startup screen while checking auth status
            <Stack.Screen component={Startup} name={Paths.Startup} />
          ) : isAuthenticated ? (
            // Authenticated screens
            <>
              <Stack.Screen component={Home} name={Paths.Home} />
              <Stack.Screen
                component={Chat}
                name={Paths.Chat}
                options={{ headerShown: false, title: 'Wardrobe Assistant' }}
              />
              <Stack.Screen
                component={TestDetectionScreen}
                name={Paths.TestDetection}
                options={{ headerShown: true, title: 'Test Detection' }}
              />
            </>
          ) : (
            // Unauthenticated screens
            <>
              <Stack.Screen component={Login} name={Paths.Login} />
              <Stack.Screen component={Register} name={Paths.Register} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default ApplicationNavigator;
