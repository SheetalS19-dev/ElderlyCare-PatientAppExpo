import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface Props {
  htmlContent?: string;
  isExpanded?: boolean;
}

/**
 * Replaces UTF-8 / Windows-1252 mojibake artifacts returned by the backend.
 */
export const cleanMojibake = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/â€™/g, "’")
    .replace(/â€˜/g, "‘")
    .replace(/â€œ/g, '“')
    .replace(/â€\x9d/g, '”')
    .replace(/â€/g, '”')
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â€¦/g, '…')
    .replace(/Â/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

interface Block {
  type: 'h2' | 'h3' | 'h4' | 'p' | 'li' | 'blockquote';
  text: string;
  links: { text: string; url: string }[];
}

/**
 * Parses simple blog HTML into structured blocks and renders them with proper React Native styles.
 */
export const BlogContentRenderer: React.FC<Props> = React.memo(({ htmlContent = '', isExpanded = true }) => {
  if (!htmlContent) return null;

  // 1. Clean mojibake first
  let cleaned = cleanMojibake(htmlContent);

  // 2. Remove empty paragraph wrappers like <p><br></p> or <p>&nbsp;</p>
  cleaned = cleaned.replace(/<p[^>]*>\s*(<br\s*[\/]?>|&nbsp;|\s)*<\/p>/gi, '');

  // 3. Tokenize by major block tags
  // We match <h2>...</h2>, <h3>...</h3>, <h4>...</h4>, <p>...</p>, <li>...</li>, <blockquote>...</blockquote>
  const blockRegex = /<(h2|h3|h4|p|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  const blocks: Block[] = [];
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(cleaned)) !== null) {
    const tag = match[1].toLowerCase() as Block['type'];
    const rawInner = match[2];

    // Extract links <a href="...">text</a>
    const links: { text: string; url: string }[] = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let lMatch: RegExpExecArray | null;
    while ((lMatch = linkRegex.exec(rawInner)) !== null) {
      const url = lMatch[1];
      const linkText = lMatch[2].replace(/<[^>]+>/g, '').trim();
      if (linkText && url) {
        links.push({ text: linkText, url });
      }
    }

    // Strip all tags from inner content and normalize spacing
    const text = rawInner
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (text) {
      blocks.push({ type: tag, text, links });
    }
  }

  // Fallback: If regex didn't extract any structured blocks (e.g. plain text or unusual markup)
  if (blocks.length === 0) {
    const plain = cleaned.replace(/<[^>]+>/g, '').trim();
    if (!plain) return null;
    return (
      <View style={styles.container}>
        <Text style={styles.paragraph}>{plain}</Text>
      </View>
    );
  }

  // Slice blocks if truncated
  const renderedBlocks = isExpanded ? blocks : blocks.slice(0, 3);

  const handleLinkPress = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch((e) => console.warn('Could not open blog link:', e));
  };

  /**
   * Renders paragraph text with clickable embedded links.
   */
  const renderRichText = (block: Block, baseStyle: any) => {
    if (block.links.length === 0) {
      return <Text style={baseStyle}>{block.text}</Text>;
    }

    // Replace links in text
    let remaining = block.text;
    const elements: React.ReactNode[] = [];
    let keyIdx = 0;

    for (const link of block.links) {
      const idx = remaining.indexOf(link.text);
      if (idx !== -1) {
        if (idx > 0) {
          elements.push(
            <Text key={`txt-${keyIdx++}`} style={baseStyle}>
              {remaining.substring(0, idx)}
            </Text>
          );
        }
        elements.push(
          <Text
            key={`lnk-${keyIdx++}`}
            style={[baseStyle, styles.inlineLink]}
            onPress={() => handleLinkPress(link.url)}
          >
            {link.text}
          </Text>
        );
        remaining = remaining.substring(idx + link.text.length);
      }
    }

    if (remaining) {
      elements.push(
        <Text key={`txt-${keyIdx++}`} style={baseStyle}>
          {remaining}
        </Text>
      );
    }

    return elements;
  };

  return (
    <View style={styles.container}>
      {renderedBlocks.map((b, idx) => {
        if (b.type === 'h2') {
          return (
            <Text key={`h2-${idx}`} style={styles.h2}>
              {b.text}
            </Text>
          );
        }
        if (b.type === 'h3' || b.type === 'h4') {
          return (
            <Text key={`h3-${idx}`} style={styles.h3}>
              {b.text}
            </Text>
          );
        }
        if (b.type === 'li') {
          return (
            <View key={`li-${idx}`} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{renderRichText(b, styles.bulletText)}</Text>
            </View>
          );
        }
        if (b.type === 'blockquote') {
          return (
            <View key={`bq-${idx}`} style={styles.blockquote}>
              <Text style={styles.blockquoteText}>{renderRichText(b, styles.blockquoteText)}</Text>
            </View>
          );
        }
        return (
          <Text key={`p-${idx}`} style={styles.paragraph}>
            {renderRichText(b, styles.paragraph)}
          </Text>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  h2: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_1E293B,
    marginTop: hs(14),
    marginBottom: hs(6),
    lineHeight: hs(22),
  },
  h3: {
    fontSize: fs(14.5),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_1E293B,
    marginTop: hs(10),
    marginBottom: hs(4),
    lineHeight: hs(20),
  },
  paragraph: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_64748B,
    lineHeight: hs(21),
    marginBottom: hs(10),
  },
  inlineLink: {
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
    ...TYPOGRAPHY.medium,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hs(6),
    paddingLeft: ws(6),
  },
  bulletDot: {
    width: ws(5),
    height: ws(5),
    borderRadius: 999,
    backgroundColor: Colors.primaryColor,
    marginTop: hs(8),
    marginRight: ws(8),
  },
  bulletText: {
    flex: 1,
    fontSize: fs(13.5),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_64748B,
    lineHeight: hs(20),
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryColor,
    paddingLeft: ws(12),
    marginVertical: hs(8),
    backgroundColor: Colors.aquaSoft,
    paddingVertical: hs(6),
    borderRadius: fs(4),
  },
  blockquoteText: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.regular,
    fontStyle: 'italic',
    color: Colors.slate_1E293B,
    lineHeight: hs(20),
  },
});
