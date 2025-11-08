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

interface CreativeGeometricTemplateProps {
  data: PDFOnePagerData;
  brandProfile?: BrandProfile;
  logoUrl?: string;
  clientName: string;
}

export function CreativeGeometricTemplate({
  data,
  brandProfile,
  logoUrl,
  clientName,
}: CreativeGeometricTemplateProps) {
  const primaryColor = brandProfile?.colors[0] || '#8B5CF6'; // Default purple
  const secondaryColor = brandProfile?.colors[1] || '#EC4899';
  const accentColor = brandProfile?.colors[2] || '#F3E8FF';

  const styles = StyleSheet.create({
    page: {
      backgroundColor: '#FFFFFF',
      padding: 0,
      fontFamily: 'Helvetica',
      position: 'relative',
    },
    // Hero Section with Angle
    hero: {
      backgroundColor: primaryColor,
      padding: 45,
      paddingTop: 50,
      paddingBottom: 70,
      position: 'relative',
    },
    logoWrapper: {
      alignItems: 'flex-end',
      marginBottom: 20,
    },
    logo: {
      width: 60,
      height: 60,
      objectFit: 'contain',
      backgroundColor: '#FFFFFF',
      borderRadius: 30,
      padding: 8,
    },
    headline: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 15,
      lineHeight: 1.2,
      maxWidth: '85%',
      fontFamily: 'Helvetica-Bold',
    },
    subheadline: {
      fontSize: 13,
      color: '#FFFFFF',
      opacity: 0.95,
      lineHeight: 1.5,
      maxWidth: '75%',
    },
    // Geometric Shape Overlay
    shapeOverlay: {
      position: 'absolute',
      bottom: -30,
      right: 40,
      width: 100,
      height: 100,
      backgroundColor: secondaryColor,
      borderRadius: 50,
      opacity: 0.9,
    },
    // Stats - Circular Design
    statsSection: {
      padding: 40,
      paddingTop: 50,
      paddingBottom: 35,
      backgroundColor: '#FAFAFA',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: 15,
    },
    statCircle: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: '#FFFFFF',
      border: `4px solid ${primaryColor}`,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: primaryColor,
      marginBottom: 4,
      fontFamily: 'Helvetica-Bold',
    },
    statLabel: {
      fontSize: 8,
      color: '#64748B',
      textAlign: 'center',
      maxWidth: 80,
      lineHeight: 1.3,
    },
    // Benefits - Card Grid
    benefitsSection: {
      padding: 40,
      paddingTop: 35,
      paddingBottom: 35,
      backgroundColor: '#FFFFFF',
    },
    benefitsHeader: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#1F2937',
      marginBottom: 6,
      fontFamily: 'Helvetica-Bold',
    },
    sectionSubtitle: {
      fontSize: 10,
      color: primaryColor,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      fontFamily: 'Helvetica-Bold',
    },
    benefitsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    benefitCard: {
      width: '48%',
      padding: 15,
      backgroundColor: accentColor,
      borderRadius: 8,
      borderLeft: `4px solid ${secondaryColor}`,
      position: 'relative',
    },
    benefitIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: primaryColor,
      marginBottom: 8,
    },
    benefitText: {
      fontSize: 10,
      color: '#374151',
      lineHeight: 1.5,
    },
    // CTA with Gradient Effect
    ctaSection: {
      backgroundColor: primaryColor,
      padding: 40,
      paddingTop: 30,
      paddingBottom: 30,
      position: 'relative',
    },
    ctaShape: {
      position: 'absolute',
      top: -25,
      left: 30,
      width: 60,
      height: 60,
      backgroundColor: secondaryColor,
      transform: 'rotate(45deg)',
      opacity: 0.8,
    },
    ctaContent: {
      position: 'relative',
      zIndex: 10,
    },
    ctaHeading: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 18,
      fontFamily: 'Helvetica-Bold',
    },
    contactBubbles: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap',
    },
    contactBubble: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    contactText: {
      fontSize: 10,
      color: '#FFFFFF',
    },
    // Footer
    footer: {
      padding: 12,
      backgroundColor: '#111827',
      alignItems: 'center',
    },
    footerText: {
      fontSize: 7,
      color: 'rgba(255, 255, 255, 0.6)',
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Hero Section */}
        <View style={styles.hero}>
          {logoUrl && (
            <View style={styles.logoWrapper}>
              <Image src={logoUrl} style={styles.logo} />
            </View>
          )}
          <Text style={styles.headline}>{data.headline}</Text>
          <Text style={styles.subheadline}>{data.subheadline}</Text>
          <View style={styles.shapeOverlay} />
        </View>

        {/* Stats Section */}
        {data.stats && data.stats.length > 0 && (
          <View style={styles.statsSection}>
            <View style={styles.statsGrid}>
              {data.stats.map((stat, index) => (
                <View key={index} style={styles.statCircle}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <View style={styles.benefitsHeader}>
            <Text style={styles.sectionSubtitle}>What You Get</Text>
            <Text style={styles.sectionTitle}>Key Benefits</Text>
          </View>
          <View style={styles.benefitsGrid}>
            {data.keyBenefits.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <View style={styles.benefitIcon} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaShape} />
          <View style={styles.ctaContent}>
            <Text style={styles.ctaHeading}>{data.callToAction}</Text>
            <View style={styles.contactBubbles}>
              {data.contactInfo.email && (
                <View style={styles.contactBubble}>
                  <Text style={styles.contactText}>{data.contactInfo.email}</Text>
                </View>
              )}
              {data.contactInfo.phone && (
                <View style={styles.contactBubble}>
                  <Text style={styles.contactText}>{data.contactInfo.phone}</Text>
                </View>
              )}
              {data.contactInfo.website && (
                <View style={styles.contactBubble}>
                  <Text style={styles.contactText}>{data.contactInfo.website}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {clientName} • Crafted by BluePeak Marketing
          </Text>
        </View>
      </Page>
    </Document>
  );
}
