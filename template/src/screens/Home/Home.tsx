import type { RootScreenProps } from '@/navigation/types';

import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Paths } from '@/navigation/paths';
import { useTheme } from '@/theme';

import { IconByVariant } from '@/components/atoms';
import { SafeScreen } from '@/components/templates';

type ActionCardProps = {
  readonly color: string;
  readonly description: string;
  readonly icon: string;
  readonly onPress: () => void;
  readonly title: string;
};

function ActionCard({ color, description, icon, onPress, title }: ActionCardProps) {
  const { backgrounds, borders, fonts, gutters, layout } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        backgrounds.secondarySystemBackground,
        borders.rounded_16,
        gutters.padding_16,
        gutters.marginBottom_16,
        styles.cardShadow,
      ]}
    >
      <View style={[layout.row, layout.itemsCenter, gutters.gap_12]}>
        <View
          style={[
            {
              backgroundColor: `${color}15`,
              borderRadius: 12,
              padding: 12,
            },
          ]}
        >
          <IconByVariant
            height={28}
            path={icon}
            stroke={color}
            width={28}
          />
        </View>
        <View style={[layout.flex_1]}>
          <Text
            style={[
              fonts.size_20,
              fonts.bold,
              fonts.label,
              gutters.marginBottom_4,
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              fonts.size_15,
              fonts.secondaryLabel,
              { lineHeight: 20 },
            ]}
          >
            {description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Home({ navigation }: RootScreenProps<Paths.Home>) {
  const { t } = useTranslation();
  const { backgrounds, borders, colors, fonts, gutters, layout } = useTheme();

  const handleWardrobePress = () => {
    // Navigate to wardrobe selection
    // navigation.navigate(Paths.Wardrobe);
  };

  const handleSavedImagesPress = () => {
    // Navigate to saved images
    // navigation.navigate(Paths.SavedImages);
  };

  const handleUploadPress = () => {
    // Navigate to upload screen
    navigation.navigate(Paths.Auxi);
  };

  const handleChatPress = () => {
    navigation.navigate(Paths.Chat);
  };

  const handleTestDetectionPress = () => {
    navigation.navigate(Paths.TestDetection);
  };

  return (
    <SafeScreen>
      <ScrollView
        contentContainerStyle={[
          gutters.paddingHorizontal_20,
          gutters.paddingTop_24,
          gutters.paddingBottom_32,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={[gutters.marginBottom_32]}>
          <Text
            style={[
              fonts.size_34,
              fonts.bold,
              fonts.label,
              gutters.marginBottom_8,
            ]}
          >
            {t('screen_home.title', { defaultValue: 'Wardrobe' })}
          </Text>
          <Text
            style={[
              fonts.size_17,
              fonts.secondaryLabel,
              { lineHeight: 24 },
            ]}
          >
            {t('screen_home.subtitle', {
              defaultValue: 'Choose how you want to get started with your outfit',
            })}
          </Text>
        </View>

        {/* Action Cards Section */}
        <View style={[gutters.marginBottom_24]}>
          <Text
            style={[
              fonts.size_22,
              fonts.bold,
              fonts.label,
              gutters.marginBottom_16,
            ]}
          >
            {t('screen_home.choose_source', { defaultValue: 'Choose Image Source' })}
          </Text>

          <ActionCard
            color={colors.systemBlue}
            description={t('screen_home.wardrobe_description', {
              defaultValue: 'Browse your saved wardrobe items and select from your collection',
            })}
            icon="send"
            onPress={handleWardrobePress}
            title={t('screen_home.wardrobe_title', { defaultValue: 'From Wardrobe' })}
          />

          <ActionCard
            color={colors.systemIndigo}
            description={t('screen_home.chat_description', {
              defaultValue: 'Ask the Wardrobe Assistant questions and build outfits',
            })}
            icon="send"
            onPress={handleChatPress}
            title={t('screen_home.chat_title', { defaultValue: 'Chat with AI' })}
          />

          <ActionCard
            color={colors.systemGreen}
            description={t('screen_home.saved_description', {
              defaultValue: 'Use previously saved images from your gallery',
            })}
            icon="send"
            onPress={handleSavedImagesPress}
            title={t('screen_home.saved_title', { defaultValue: 'Saved Images' })}
          />

          <ActionCard
            color={colors.systemPurple}
            description={t('screen_home.upload_description', {
              defaultValue: 'Upload a new image from your camera or photo library',
            })}
            icon="send"
            onPress={handleUploadPress}
            title={t('screen_home.upload_title', { defaultValue: 'Upload New Image' })}
          />

          <ActionCard
            color={colors.systemRed}
            description="Test YOLO garment detection with an image from your gallery"
            icon="send"
            onPress={handleTestDetectionPress}
            title="Test YOLO Detection"
          />
        </View>

        {/* Quick Actions Section */}
        <View style={[gutters.marginTop_8]}>
          <Text
            style={[
              fonts.size_22,
              fonts.bold,
              fonts.label,
              gutters.marginBottom_16,
            ]}
          >
            {t('screen_home.quick_actions', { defaultValue: 'Quick Actions' })}
          </Text>

          <View
            style={[
              backgrounds.secondarySystemBackground,
              borders.rounded_16,
              gutters.padding_16,
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.paddingVertical_12,
              ]}
            >
              <View style={[layout.row, layout.itemsCenter, gutters.gap_12]}>
                <View
                  style={[
                    {
                      backgroundColor: `${colors.systemOrange}15`,
                      borderRadius: 8,
                      padding: 8,
                    },
                  ]}
                >
                  <IconByVariant
                    height={20}
                    path="send"
                    stroke={colors.systemOrange}
                    width={20}
                  />
                </View>
                <Text style={[fonts.size_17, fonts.label]}>
                  {t('screen_home.favorites', { defaultValue: 'Favorites' })}
                </Text>
              </View>
              <IconByVariant
                height={16}
                path="send"
                stroke={colors.systemGray}
                width={16}
              />
            </TouchableOpacity>

            <View
              style={[
                {
                  backgroundColor: colors.separator,
                  height: 1,
                  marginVertical: 8,
                },
              ]}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.paddingVertical_12,
              ]}
            >
              <View style={[layout.row, layout.itemsCenter, gutters.gap_12]}>
                <View
                  style={[
                    {
                      backgroundColor: `${colors.systemIndigo}15`,
                      borderRadius: 8,
                      padding: 8,
                    },
                  ]}
                >
                  <IconByVariant
                    height={20}
                    path="send"
                    stroke={colors.systemIndigo}
                    width={20}
                  />
                </View>
                <Text style={[fonts.size_17, fonts.label]}>
                  {t('screen_home.recent', { defaultValue: 'Recent Outfits' })}
                </Text>
              </View>
              <IconByVariant
                height={16}
                path="send"
                stroke={colors.systemGray}
                width={16}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    elevation: 3,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});

export default Home;
