'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { GeneratedContent, Campaign } from '@/types';

interface ContentPDFProps {
  content: GeneratedContent;
  campaign: Campaign;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 8,
  },
  metadataItem: {
    fontSize: 9,
    color: '#94a3b8',
  },
  contentSection: {
    marginTop: 20,
  },
  contentText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#334155',
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#94a3b8',
  },
  brandAccent: {
    width: 4,
    backgroundColor: '#6366f1',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  contentTypeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
});

export default function ContentPDF({ content, campaign }: ContentPDFProps) {
  const primaryColor = campaign.brandProfile?.colors?.[0] || '#6366f1';

  // Override brand color in styles
  const customStyles = {
    ...styles,
    header: {
      ...styles.header,
      borderBottomColor: primaryColor,
    },
    brandAccent: {
      ...styles.brandAccent,
      backgroundColor: primaryColor,
    },
    contentTypeLabel: {
      ...styles.contentTypeLabel,
      color: primaryColor,
    },
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      blog: 'Blog Post',
      linkedin: 'LinkedIn Post',
      twitter: 'Twitter Thread',
      email: 'Email Copy',
      'ad-copy': 'Ad Copy',
    };
    return labels[type] || type;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={customStyles.brandAccent} />

        {/* Header */}
        <View style={customStyles.header}>
          <Text style={customStyles.contentTypeLabel}>
            {getContentTypeLabel(content.type)}
          </Text>
          <Text style={styles.title}>{campaign.clientName}</Text>
          <Text style={styles.subtitle}>{campaign.topic}</Text>
          <View style={styles.metadata}>
            <Text style={styles.metadataItem}>
              Industry: {campaign.industry}
            </Text>
            <Text style={styles.metadataItem}>
              Target: {campaign.targetAudience}
            </Text>
            {content.wordCount && (
              <Text style={styles.metadataItem}>
                {content.wordCount} words
              </Text>
            )}
            <Text style={styles.metadataItem}>
              {formatDate(content.generatedAt)}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentSection}>
          <Text style={styles.contentText}>{content.content}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated with BluePeak Marketing
          </Text>
          <Text style={styles.footerText}>
            {formatDate(new Date())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
