import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { PDFOnePagerData, BrandProfile } from '@/types';

interface OnePagerTemplateProps {
  data: PDFOnePagerData;
  brandProfile?: BrandProfile;
  logoUrl?: string;
  clientName: string;
}

export function OnePagerTemplate({
  data,
  brandProfile,
  logoUrl,
  clientName,
}: OnePagerTemplateProps) {
  // Use brand colors or fallback to default indigo palette
  const primaryColor = brandProfile?.colors[0] || '#4F46E5';
  const secondaryColor = brandProfile?.colors[1] || '#818CF8';
  const accentColor = brandProfile?.colors[2] || '#C7D2FE';

  const styles = StyleSheet.create({
    page: {
      backgroundColor: '#FFFFFF',
      padding: 0,
      fontFamily: 'Helvetica',
    },
    // Hero Section
    hero: {
      backgroundColor: primaryColor,
      padding: 45,
      paddingTop: 48,
      paddingBottom: 48,
    },
    logoContainer: {
      marginBottom: 20,
      alignItems: 'center',
    },
    logo: {
      width: 60,
      height: 60,
      objectFit: 'contain',
    },
    headline: {
      fontSize: 26,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 10,
      textAlign: 'center',
      lineHeight: 1.2,
    },
    subheadline: {
      fontSize: 13,
      color: '#FFFFFF',
      textAlign: 'center',
      opacity: 0.95,
      lineHeight: 1.3,
    },
    // Stats Section
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: accentColor,
      padding: 28,
      paddingTop: 26,
      paddingBottom: 26,
    },
    statBox: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: primaryColor,
      marginBottom: 3,
    },
    statLabel: {
      fontSize: 9,
      color: '#334155',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    // Benefits Section
    benefitsSection: {
      padding: 45,
      paddingTop: 38,
      paddingBottom: 38,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1E293B',
      marginBottom: 16,
      textAlign: 'center',
    },
    benefitsList: {
      gap: 8,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    benefitBullet: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: secondaryColor,
      marginRight: 10,
      marginTop: 2,
    },
    benefitText: {
      fontSize: 11,
      color: '#334155',
      lineHeight: 1.4,
      flex: 1,
    },
    // CTA Section
    ctaSection: {
      backgroundColor: primaryColor,
      padding: 45,
      paddingTop: 34,
      paddingBottom: 34,
    },
    ctaText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 14,
    },
    contactContainer: {
      alignItems: 'center',
      gap: 4,
    },
    contactText: {
      fontSize: 11,
      color: '#FFFFFF',
      opacity: 0.95,
    },
    // Footer
    footer: {
      padding: 12,
      backgroundColor: '#F1F5F9',
      alignItems: 'center',
    },
    footerText: {
      fontSize: 8,
      color: '#64748B',
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Hero Section */}
        <View style={styles.hero}>
          {logoUrl && (
            <View style={styles.logoContainer}>
              <Image src={logoUrl} style={styles.logo} />
            </View>
          )}
          <Text style={styles.headline}>{data.headline}</Text>
          <Text style={styles.subheadline}>{data.subheadline}</Text>
        </View>

        {/* Stats Section */}
        {data.stats && data.stats.length > 0 && (
          <View style={styles.statsContainer}>
            {data.stats.map((stat, index) => (
              <View key={index} style={styles.statBox}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Key Benefits</Text>
          <View style={styles.benefitsList}>
            {data.keyBenefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View style={styles.benefitBullet} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaText}>{data.callToAction}</Text>
          <View style={styles.contactContainer}>
            {data.contactInfo.email && (
              <Text style={styles.contactText}>{data.contactInfo.email}</Text>
            )}
            {data.contactInfo.phone && (
              <Text style={styles.contactText}>{data.contactInfo.phone}</Text>
            )}
            {data.contactInfo.website && (
              <Text style={styles.contactText}>{data.contactInfo.website}</Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Created with BluePeak Marketing • {clientName}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
