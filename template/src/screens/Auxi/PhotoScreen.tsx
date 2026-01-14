import { SafeScreen } from '@/components/template';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme';

function PhotoScreen() {
    const { layout, fonts, gutters } = useTheme();

    return (
        <SafeScreen>
            <View style={[layout.flex_1, layout.justifyContentCenter, layout.itemsCenter]}>
                <Text style={[fonts.size_32, fonts.gray800, gutters.marginBottom_16]}>
                    Photo Screen
                </Text>
                <Text style={[fonts.gray400]}>Camera/Photo Input Placeholder</Text>
            </View>
        </SafeScreen>
    );
}

export default PhotoScreen;
