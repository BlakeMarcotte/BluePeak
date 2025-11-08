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

interface BoldImpactTemplateProps {
  data: PDFOnePagerData;
  brandProfile?: BrandProfile;
  logoUrl?: string;
  clientName: string;
}

export function BoldImpactTemplate({
  data,
  brandProfile,
  logoUrl,
  clientName,
}: BoldImpactTemplateProps) {
  const primaryColor = brandProfile?.colors[0] || '#4F46E5';
  const secondaryColor = brandProfile?.colors[1] || '#818CF8';
  const accentColor = brandProfile?.colors[2] || '#C7D2FE';

  const styles = StyleSheet.create({
    page: {
      backgroundColor: '#FFFFFF',
      padding: 0,
      fontFamily: 'Helvetica-Bold',
    },
    // Hero Section - Full Bleed
    hero: {
      backgroundColor: primaryColor,
      padding: 45,
      paddingTop: 55,
      paddingBottom: 55,
      position: 'relative',
    },
    logoContainer: {
      position: 'absolute',
      top: 20,
      right: 20,
    },
    logo: {
      width: 50,
      height: 50,
      objectFit: 'contain',
    },
    headline: {
      fontSize: 34,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 18,
      lineHeight: 1.15,
      letterSpacing: -0.5,
    },
    subheadline: {
      fontSize: 15,
      color: '#FFFFFF',
      opacity: 0.9,
      lineHeight: 1.5,
      maxWidth: '80%',
    },
    // Stats Bar - High Contrast
    statsBar: {
      backgroundColor: '#000000',
      padding: 28,
      paddingTop: 24,
      paddingBottom: 24,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statBox: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: primaryColor,
      marginBottom: 5,
    },
    statLabel: {
      fontSize: 9,
      color: '#FFFFFF',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // Benefits Section
    benefitsSection: {
      padding: 45,
      paddingTop: 35,
      paddingBottom: 35,
      backgroundColor: '#FFFFFF',
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 20,
      letterSpacing: -0.5,
    },
    benefitsList: {
      gap: 13,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    benefitNumber: {
      width: 32,
      height: 32,
      backgroundColor: primaryColor,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 15,
      flexShrink: 0,
    },
    benefitNumberText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    benefitText: {
      fontSize: 12,
      color: '#1F2937',
      lineHeight: 1.6,
      flex: 1,
      paddingTop: 6,
      fontFamily: 'Helvetica',
    },
    // CTA Section - Full Bleed
    ctaSection: {
      backgroundColor: secondaryColor,
      padding: 45,
      paddingTop: 32,
      paddingBottom: 32,
    },
    ctaText: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 18,
      letterSpacing: -0.3,
    },
    contactGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 15,
    },
    contactItem: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      padding: 10,
      paddingLeft: 15,
      paddingRight: 15,
      borderRadius: 6,
    },
    contactText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontFamily: 'Helvetica',
    },
    // Footer
    footer: {
      padding: 12,
      backgroundColor: '#000000',
      alignItems: 'center',
    },
    footerText: {
      fontSize: 8,
      color: '#FFFFFF',
      opacity: 0.6,
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

        {/* Stats Bar */}
        {data.stats && data.stats.length > 0 && (
          <View style={styles.statsBar}>
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
          <Text style={styles.sectionTitle}>Why Choose Us</Text>
          <View style={styles.benefitsList}>
            {data.keyBenefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View style={styles.benefitNumber}>
                  <Text style={styles.benefitNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaText}>{data.callToAction}</Text>
          <View style={styles.contactGrid}>
            {data.contactInfo.email && (
              <View style={styles.contactItem}>
                <Text style={styles.contactText}>{data.contactInfo.email}</Text>
              </View>
            )}
            {data.contactInfo.phone && (
              <View style={styles.contactItem}>
                <Text style={styles.contactText}>{data.contactInfo.phone}</Text>
              </View>
            )}
            {data.contactInfo.website && (
              <View style={styles.contactItem}>
                <Text style={styles.contactText}>{data.contactInfo.website}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {clientName} • Powered by BluePeak Marketing
          </Text>
        </View>
      </Page>
    </Document>
  );
}
