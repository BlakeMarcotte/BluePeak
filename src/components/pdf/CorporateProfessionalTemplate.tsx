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

interface CorporateProfessionalTemplateProps {
  data: PDFOnePagerData;
  brandProfile?: BrandProfile;
  logoUrl?: string;
  clientName: string;
}

export function CorporateProfessionalTemplate({
  data,
  brandProfile,
  logoUrl,
  clientName,
}: CorporateProfessionalTemplateProps) {
  const primaryColor = brandProfile?.colors[0] || '#1E3A8A'; // Default navy
  const secondaryColor = brandProfile?.colors[1] || '#3B82F6';
  const accentColor = brandProfile?.colors[2] || '#DBEAFE';

  const styles = StyleSheet.create({
    page: {
      backgroundColor: '#FFFFFF',
      padding: 0,
      fontFamily: 'Helvetica',
    },
    // Header with Logo
    header: {
      backgroundColor: '#F8FAFC',
      padding: 36,
      paddingTop: 26,
      paddingBottom: 26,
      borderBottom: `3px solid ${primaryColor}`,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logoContainer: {
      width: 70,
      height: 70,
    },
    logo: {
      width: 70,
      height: 70,
      objectFit: 'contain',
    },
    headerText: {
      flex: 1,
      alignItems: 'flex-end',
    },
    companyName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: primaryColor,
      fontFamily: 'Helvetica-Bold',
    },
    tagline: {
      fontSize: 10,
      color: '#64748B',
      marginTop: 1,
    },
    // Executive Summary
    executiveSummary: {
      padding: 36,
      paddingTop: 28,
      paddingBottom: 28,
      backgroundColor: '#FFFFFF',
    },
    sectionLabel: {
      fontSize: 10,
      color: primaryColor,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 6,
      fontFamily: 'Helvetica-Bold',
    },
    mainHeadline: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#0F172A',
      marginBottom: 10,
      lineHeight: 1.2,
      fontFamily: 'Helvetica-Bold',
    },
    subtext: {
      fontSize: 11,
      color: '#475569',
      lineHeight: 1.6,
    },
    // Stats Grid
    statsGrid: {
      backgroundColor: accentColor,
      padding: 28,
      paddingTop: 22,
      paddingBottom: 22,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statCard: {
      backgroundColor: '#FFFFFF',
      padding: 18,
      flex: 1,
      marginHorizontal: 5,
      borderRadius: 4,
      borderLeft: `4px solid ${primaryColor}`,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 26,
      fontWeight: 'bold',
      color: primaryColor,
      marginBottom: 4,
      fontFamily: 'Helvetica-Bold',
    },
    statLabel: {
      fontSize: 9,
      color: '#64748B',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    // Key Benefits - Two Column
    benefitsSection: {
      padding: 36,
      paddingTop: 28,
      paddingBottom: 26,
    },
    benefitsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    benefitCard: {
      width: '48%',
      backgroundColor: '#F8FAFC',
      padding: 14,
      borderRadius: 4,
      borderTop: `3px solid ${secondaryColor}`,
    },
    benefitTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#0F172A',
      marginBottom: 4,
      fontFamily: 'Helvetica-Bold',
    },
    benefitText: {
      fontSize: 9,
      color: '#475569',
      lineHeight: 1.5,
    },
    // CTA Section
    ctaSection: {
      backgroundColor: primaryColor,
      padding: 36,
      paddingTop: 26,
      paddingBottom: 26,
    },
    ctaHeading: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 12,
      fontFamily: 'Helvetica-Bold',
    },
    contactTable: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      padding: 12,
      borderRadius: 4,
    },
    contactRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    contactLabel: {
      fontSize: 9,
      color: 'rgba(255, 255, 255, 0.7)',
      width: 80,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    contactValue: {
      fontSize: 10,
      color: '#FFFFFF',
      flex: 1,
    },
    // Footer
    footer: {
      padding: 10,
      backgroundColor: '#F1F5F9',
      alignItems: 'center',
      borderTop: '1px solid #E2E8F0',
    },
    footerText: {
      fontSize: 8,
      color: '#64748B',
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {logoUrl && (
            <View style={styles.logoContainer}>
              <Image src={logoUrl} style={styles.logo} />
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.companyName}>{clientName}</Text>
            <Text style={styles.tagline}>Professional Marketing Solutions</Text>
          </View>
        </View>

        {/* Executive Summary */}
        <View style={styles.executiveSummary}>
          <Text style={styles.sectionLabel}>Executive Summary</Text>
          <Text style={styles.mainHeadline}>{data.headline}</Text>
          <Text style={styles.subtext}>{data.subheadline}</Text>
        </View>

        {/* Stats Grid */}
        {data.stats && data.stats.length > 0 && (
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              {data.stats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Key Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionLabel}>Key Advantages</Text>
          <View style={styles.benefitsGrid}>
            {data.keyBenefits.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <Text style={styles.benefitTitle}>Advantage {index + 1}</Text>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaHeading}>{data.callToAction}</Text>
          <View style={styles.contactTable}>
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>{data.contactInfo.email}</Text>
            </View>
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>{data.contactInfo.phone}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} {clientName} • Created with BluePeak Marketing
          </Text>
        </View>
      </Page>
    </Document>
  );
}
