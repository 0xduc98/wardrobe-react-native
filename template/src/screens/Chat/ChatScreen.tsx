import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  type ListRenderItemInfo,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { type ChatMessage, useChat } from '@/hooks/useChat';
import { useTheme } from '@/theme';

import {
  AttachmentList,
  AttachmentPicker,
  MarkdownText,
  type SelectedAttachment,
  ToolCallList,
} from '@/components/chat';
import { SafeScreen } from '@/components/templates';

type ErrorDisplayProps = {
  readonly error: string;
  readonly onRetry: () => void;
};

const TOOL_LABELS: Record<string, string> = {
  add_body_reference: 'Adding body reference...',
  add_wardrobe_item: 'Adding to wardrobe...',
  body_list: 'Loading body references...',
  get_tryon_result: 'Checking try-on status...',
  tryon_highres: 'Generating high-res try-on...',
  tryon_preview: 'Creating try-on preview...',
  wardrobe_get_item: 'Getting item details...',
  wardrobe_search: 'Searching wardrobe...',
};

const SCROLL_DELAY = 100;
const KEYBOARD_OFFSET = 90;

function ChatScreen() {
  const { backgrounds, colors, fonts, gutters, layout } = useTheme();
  const navigation = useNavigation();
  const {
    addAttachment,
    clearSession,
    currentTool,
    error,
    isLoading,
    messages,
    pendingAttachments,
    removeAttachment,
    retryLastMessage,
    sendMessage,
  } = useChat();
  const [input, setInput] = useState('');
  const flatListReference = useRef<FlatList<ChatMessage>>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListReference.current?.scrollToEnd({ animated: true });
      }, SCROLL_DELAY);
    }
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && pendingAttachments.length === 0) || isLoading) {
      return;
    }
    const message = input;
    setInput('');
    await sendMessage(message, true);
  };

  const handleAttachmentSelect = (attachment: SelectedAttachment) => {
    addAttachment({
      name: attachment.name,
      size: attachment.size,
      type: attachment.type,
      uri: attachment.uri,
    });
  };

  const renderEmptyState = () => (
    <View style={[layout.flex_1, layout.justifyCenter, layout.itemsCenter, gutters.padding_32]}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.systemGray6 }]}>
        <Text style={styles.emptyIcon}>W</Text>
      </View>
      <Text
        style={[
          fonts.size_20,
          fonts.bold,
          gutters.marginTop_16,
          { color: colors.label, textAlign: 'center' },
        ]}
      >
        Wardrobe Assistant
      </Text>
      <Text
        style={[
          fonts.size_16,
          gutters.marginTop_8,
          { color: colors.secondaryLabel, textAlign: 'center' },
        ]}
      >
        How can I help you with your style today?
      </Text>
      <View style={[gutters.marginTop_24, { maxWidth: 280 }]}>
        <Text style={[fonts.size_13, { color: colors.tertiaryLabel, textAlign: 'center' }]}>
          Try asking me to search your wardrobe, add new items, or create virtual try-ons.
        </Text>
      </View>
    </View>
  );

  const renderErrorDisplay = ({ error: errorMessage, onRetry }: ErrorDisplayProps) => (
    <View
      style={[
        layout.row,
        layout.itemsCenter,
        gutters.padding_12,
        gutters.marginHorizontal_16,
        gutters.marginBottom_8,
        styles.errorContainer,
        { backgroundColor: `${colors.systemRed}15` },
      ]}
    >
      <View style={layout.flex_1}>
        <Text style={[fonts.size_13, { color: colors.systemRed }]}>{errorMessage}</Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onRetry}
        style={[
          styles.retryButton,
          gutters.marginLeft_12,
          { backgroundColor: colors.systemRed },
        ]}
      >
        <Text style={[fonts.size_13, fonts.bold, { color: '#FFFFFF' }]}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMessage = ({ item }: ListRenderItemInfo<ChatMessage>) => {
    const isUser = item.role === 'user';
    const hasContent = Boolean(item.content);
    const isStreaming = Boolean(item.isStreaming);
    const hasToolCalls = item.toolCalls !== undefined && item.toolCalls.length > 0;
    const hasAttachments = item.attachments !== undefined && item.attachments.length > 0;

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? layout.itemsEnd : layout.itemsStart,
          gutters.marginBottom_12,
        ]}
      >
        {/* Attachment thumbnails for user messages */}
        {hasAttachments && isUser ? (
          <View style={[layout.row, layout.wrap, gutters.gap_4, gutters.marginBottom_8]}>
            {item.attachments?.map((attachment) => (
              <Image
                key={attachment.id}
                source={{ uri: attachment.uri }}
                style={styles.messageThumbnail}
              />
            ))}
          </View>
        ) : undefined}

        {/* Message bubble */}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            isUser
              ? { backgroundColor: colors.systemBlue }
              : { backgroundColor: colors.systemGray5 },
          ]}
        >
          {hasContent ? (
            <MarkdownText isUser={isUser}>
              {item.content}
            </MarkdownText>
          ) : isStreaming ? (
            <ActivityIndicator
              color={isUser ? '#FFFFFF' : colors.systemGray}
              size="small"
            />
          ) : undefined}
        </View>

        {/* Tool call visualization */}
        {hasToolCalls && !isUser ? (
          <View style={[gutters.marginTop_8, { maxWidth: '80%' }]}>
            <ToolCallList
              currentTool={currentTool}
              toolCalls={item.toolCalls ?? []}
            />
          </View>
        ) : undefined}
      </View>
    );
  };

  const canSend = (input.trim() || pendingAttachments.length > 0) && !isLoading;

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? KEYBOARD_OFFSET : 0}
        style={[layout.flex_1, backgrounds.systemBackground]}
      >
        {/* Header */}
        <View
          style={[
            layout.row,
            layout.justifyBetween,
            layout.itemsCenter,
            gutters.paddingHorizontal_16,
            gutters.paddingVertical_12,
            styles.header,
            { borderBottomColor: colors.separator },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}
          >
            <Text style={[fonts.size_17, { color: colors.systemBlue }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[fonts.size_17, fonts.bold, { color: colors.label }]}>
            Wardrobe Assistant
          </Text>
          <TouchableOpacity
            onPress={() => {
              void clearSession();
            }}
          >
            <Text style={[fonts.size_17, { color: colors.systemBlue }]}>New Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Messages or Empty State */}
        {messages.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            contentContainerStyle={[gutters.padding_16, { paddingBottom: 20 }]}
            data={messages}
            keyExtractor={(item) => item.id}
            onContentSizeChange={() => {
              flatListReference.current?.scrollToEnd({ animated: true });
            }}
            ref={flatListReference}
            renderItem={renderMessage}
            style={layout.flex_1}
          />
        )}

        {/* Current Tool Indicator */}
        {currentTool !== null && currentTool !== undefined ? (
          <View
            style={[
              layout.row,
              layout.itemsCenter,
              layout.justifyCenter,
              gutters.padding_8,
              gutters.marginBottom_8,
            ]}
          >
            <ActivityIndicator color={colors.systemGray} size="small" />
            <Text
              style={[
                gutters.marginLeft_8,
                fonts.size_13,
                { color: colors.secondaryLabel },
              ]}
            >
              {TOOL_LABELS[currentTool] ?? 'Processing...'}
            </Text>
          </View>
        ) : undefined}

        {/* Error Display with Retry */}
        {error !== null && error !== undefined
          ? renderErrorDisplay({
              error,
              onRetry: () => {
                void retryLastMessage();
              },
            })
          : undefined}

        {/* Pending Attachments Preview */}
        {pendingAttachments.length > 0 ? (
          <View style={[gutters.paddingHorizontal_16, gutters.paddingTop_8]}>
            <AttachmentList
              attachments={pendingAttachments}
              onRemove={removeAttachment}
            />
          </View>
        ) : undefined}

        {/* Input Area */}
        <View
          style={[
            layout.row,
            layout.itemsEnd,
            gutters.padding_8,
            styles.inputContainer,
            {
              backgroundColor: colors.systemBackground,
              borderTopColor: colors.separator,
            },
          ]}
        >
          <AttachmentPicker
            disabled={isLoading}
            onSelect={handleAttachmentSelect}
          />
          <TextInput
            editable={!isLoading}
            maxLength={1000}
            multiline
            onChangeText={setInput}
            onSubmitEditing={() => {
              void handleSend();
            }}
            placeholder="Ask about your wardrobe..."
            placeholderTextColor={colors.systemGray}
            style={[
              styles.input,
              fonts.size_16,
              {
                backgroundColor: colors.systemGray6,
                borderColor: colors.systemGray5,
                color: colors.label,
              },
            ]}
            value={input}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={!canSend}
            onPress={() => {
              void handleSend();
            }}
            style={[
              styles.sendButton,
              {
                backgroundColor: canSend ? colors.systemBlue : colors.systemGray3,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={[fonts.size_16, fonts.bold, { color: '#FFFFFF' }]}>
                Send
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  emptyIcon: {
    color: '#007AFF',
    fontSize: 32,
    fontWeight: '700',
  },
  emptyIconContainer: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  errorContainer: {
    borderRadius: 12,
  },
  header: {
    borderBottomWidth: 0.5,
  },
  input: {
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputContainer: {
    borderTopWidth: 0.5,
  },
  messageBubble: {
    borderRadius: 18,
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  messageRow: {
    width: '100%',
  },
  messageThumbnail: {
    borderRadius: 8,
    height: 60,
    width: 60,
  },
  retryButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sendButton: {
    alignItems: 'center',
    borderRadius: 20,
    justifyContent: 'center',
    marginLeft: 8,
    minHeight: 40,
    minWidth: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
});

export default ChatScreen;
