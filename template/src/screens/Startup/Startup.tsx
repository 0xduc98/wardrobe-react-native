import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/theme';

import { AssetByVariant } from '@/components/atoms';
import { SafeScreen } from '@/components/templates';

function Startup() {
  const { gutters, layout } = useTheme();

  return (
    <SafeScreen>
      <View
        style={[
          layout.flex_1,
          layout.col,
          layout.itemsCenter,
          layout.justifyCenter,
        ]}
      >
        <AssetByVariant
          path="tom"
          resizeMode="contain"
          style={{ height: 300, width: 300 }}
        />
        <ActivityIndicator size="large" style={[gutters.marginVertical_24]} />
      </View>
    </SafeScreen>
  );
}

export default Startup;
