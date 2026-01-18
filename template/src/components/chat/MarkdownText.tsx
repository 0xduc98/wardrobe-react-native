/**
 * MarkdownText Component
 * Renders markdown content with theme-aware styling.
 */

import { useMemo } from 'react';
import { type StyleProp, StyleSheet, type TextStyle } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { useTheme } from '@/theme';

interface MarkdownTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  isUser?: boolean;
}

export function MarkdownText({ children, style, isUser = false }: MarkdownTextProps) {
  const { colors } = useTheme();

  const markdownStyles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: isUser ? '#FFFFFF' : colors.label,
          fontSize: 16,
          lineHeight: 22,
          ...(style as object),
        },
        strong: {
          fontWeight: '600' as const,
        },
        em: {
          fontStyle: 'italic' as const,
        },
        link: {
          color: isUser ? '#FFFFFF' : colors.systemBlue,
          textDecorationLine: 'underline' as const,
        },
        blockquote: {
          backgroundColor: isUser ? 'rgba(255,255,255,0.1)' : colors.systemGray6,
          borderLeftColor: isUser ? 'rgba(255,255,255,0.5)' : colors.systemGray3,
          borderLeftWidth: 3,
          paddingLeft: 12,
          paddingVertical: 4,
          marginVertical: 8,
        },
        code_inline: {
          backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : colors.systemGray5,
          borderRadius: 4,
          color: isUser ? '#FFFFFF' : colors.label,
          fontFamily: 'Menlo',
          fontSize: 14,
          paddingHorizontal: 6,
          paddingVertical: 2,
        },
        code_block: {
          backgroundColor: isUser ? 'rgba(255,255,255,0.1)' : colors.systemGray6,
          borderRadius: 8,
          fontFamily: 'Menlo',
          fontSize: 13,
          padding: 12,
          marginVertical: 8,
        },
        fence: {
          backgroundColor: isUser ? 'rgba(255,255,255,0.1)' : colors.systemGray6,
          borderRadius: 8,
          fontFamily: 'Menlo',
          fontSize: 13,
          padding: 12,
          marginVertical: 8,
        },
        bullet_list: {
          marginVertical: 4,
        },
        ordered_list: {
          marginVertical: 4,
        },
        list_item: {
          marginVertical: 2,
        },
        heading1: {
          fontSize: 22,
          fontWeight: '700' as const,
          marginTop: 12,
          marginBottom: 8,
          color: isUser ? '#FFFFFF' : colors.label,
        },
        heading2: {
          fontSize: 20,
          fontWeight: '600' as const,
          marginTop: 10,
          marginBottom: 6,
          color: isUser ? '#FFFFFF' : colors.label,
        },
        heading3: {
          fontSize: 18,
          fontWeight: '600' as const,
          marginTop: 8,
          marginBottom: 4,
          color: isUser ? '#FFFFFF' : colors.label,
        },
        paragraph: {
          marginVertical: 4,
        },
        hr: {
          backgroundColor: isUser ? 'rgba(255,255,255,0.3)' : colors.separator,
          height: 1,
          marginVertical: 12,
        },
        table: {
          borderColor: isUser ? 'rgba(255,255,255,0.3)' : colors.separator,
          borderWidth: 1,
          marginVertical: 8,
        },
        th: {
          backgroundColor: isUser ? 'rgba(255,255,255,0.1)' : colors.systemGray6,
          padding: 8,
        },
        td: {
          padding: 8,
        },
        tr: {
          borderBottomColor: isUser ? 'rgba(255,255,255,0.2)' : colors.separator,
          borderBottomWidth: 1,
        },
      }),
    [colors, isUser, style],
  );

  // Return plain text if empty or just whitespace
  if (!children || !children.trim()) {
    return null;
  }

  return (
    <Markdown style={markdownStyles}>
      {children}
    </Markdown>
  );
}
