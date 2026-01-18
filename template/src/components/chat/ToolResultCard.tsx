/**
 * ToolResultCard Component
 * Displays visual feedback for tool executions in chat.
 */

import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTheme } from '@/theme';

interface ToolCall {
  tool: string;
  args: Record<string, any>;
}

interface ToolResultCardProps {
  toolCall: ToolCall;
  isActive?: boolean;
}

const TOOL_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  add_wardrobe_item: {
    icon: '+',
    label: 'Added to Wardrobe',
    color: '#34C759', // systemGreen
  },
  wardrobe_search: {
    icon: '?',
    label: 'Searching Wardrobe',
    color: '#007AFF', // systemBlue
  },
  wardrobe_get_item: {
    icon: 'i',
    label: 'Getting Item Details',
    color: '#5856D6', // systemIndigo
  },
  add_body_reference: {
    icon: '@',
    label: 'Body Reference Added',
    color: '#AF52DE', // systemPurple
  },
  body_list: {
    icon: '#',
    label: 'Loading Body References',
    color: '#5AC8FA', // systemTeal
  },
  tryon_preview: {
    icon: '*',
    label: 'Creating Try-On Preview',
    color: '#FF9500', // systemOrange
  },
  tryon_highres: {
    icon: '*',
    label: 'Generating High-Res Try-On',
    color: '#FF2D55', // systemPink
  },
  get_tryon_result: {
    icon: '!',
    label: 'Checking Try-On Status',
    color: '#FFCC00', // systemYellow
  },
};

export function ToolResultCard({ toolCall, isActive }: ToolResultCardProps) {
  const { borders, colors, fonts, gutters, layout } = useTheme();
  const config = TOOL_CONFIG[toolCall.tool] || {
    icon: '?',
    label: toolCall.tool,
    color: colors.systemGray,
  };

  // Extract relevant data from args for display
  const imageUrl = toolCall.args?.image_url || toolCall.args?.result_url;
  const itemName = toolCall.args?.name || toolCall.args?.item_name;
  const category = toolCall.args?.category;

  return (
    <View
      style={[
        styles.container,
        borders.rounded_12,
        gutters.padding_12,
        { backgroundColor: colors.secondarySystemBackground },
      ]}
    >
      <View style={[layout.row, layout.itemsCenter, gutters.marginBottom_8]}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${config.color}20` },
          ]}
        >
          <Text style={[styles.icon, { color: config.color }]}>{config.icon}</Text>
        </View>
        <Text style={[fonts.size_13, fonts.bold, gutters.marginLeft_8, { color: colors.label }]}>
          {config.label}
        </Text>
        {isActive && (
          <ActivityIndicator
            color={config.color}
            size="small"
            style={gutters.marginLeft_8}
          />
        )}
      </View>

      {/* Item Preview */}
      {imageUrl && (
        <View style={[layout.row, gutters.marginTop_4]}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.previewImage}
          />
          {(itemName || category) && (
            <View style={[layout.flex_1, gutters.marginLeft_12]}>
              {itemName && (
                <Text style={[fonts.size_15, fonts.bold, { color: colors.label }]}>
                  {itemName}
                </Text>
              )}
              {category && (
                <Text style={[fonts.size_13, gutters.marginTop_4, { color: colors.secondaryLabel }]}>
                  {category}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Try-On Result with View High Res button */}
      {toolCall.tool === 'tryon_highres' && imageUrl && (
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.viewButton,
            gutters.marginTop_8,
            { backgroundColor: config.color },
          ]}
        >
          <Text style={[fonts.size_13, fonts.bold, { color: '#FFFFFF' }]}>
            View High Resolution
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface ToolCallListProps {
  toolCalls: ToolCall[];
  currentTool?: string | null;
}

export function ToolCallList({ toolCalls, currentTool }: ToolCallListProps) {
  const { gutters } = useTheme();

  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  return (
    <View style={gutters.marginTop_8}>
      {toolCalls.map((toolCall, index) => (
        <View key={`${toolCall.tool}-${index}`} style={gutters.marginBottom_8}>
          <ToolResultCard
            isActive={currentTool === toolCall.tool}
            toolCall={toolCall}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '100%',
  },
  icon: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  previewImage: {
    borderRadius: 8,
    height: 60,
    width: 60,
  },
  viewButton: {
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
