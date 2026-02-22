import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { Colors, Spacing } from '@/constants/Theme';

const heroImage = require('../../assets/santorini-karens-70th.png');

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ImageBackground source={heroImage} style={styles.hero} imageStyle={styles.heroImageStyle}>
        <View style={styles.heroOverlay} />
        <Text style={styles.heroSubtitle}>Santorini - Crete • Family Vacation</Text>
      </ImageBackground>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome</Text>
        <Text style={styles.cardText}>
          Everything you need for our family trip is in this app: schedule, travel details, and the guest list. Tap the tabs below to explore.
        </Text>
      </View>

      <View style={styles.quickLinks}>
        <Text style={styles.quickTitle}>Quick links</Text>
        <Text style={styles.quickItem}>📅 Schedule — calendar & daily plans (Santorini & Crete)</Text>
        <Text style={styles.quickItem}>✈️ Travel — flights, Santorini/Crete stay, transfers</Text>
        <Text style={styles.quickItem}>👨‍👩‍👧‍👦 Guests — who's coming</Text>
        <Text style={styles.quickItem}>📄 Import — update from PDFs</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl * 2 },
  hero: {
    marginHorizontal: -Spacing.lg,
    marginTop: -Spacing.lg,
    marginBottom: Spacing.lg,
    minHeight: 200,
    padding: Spacing.xl,
    paddingTop: Spacing.xl + 24,
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  heroImageStyle: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.goldLight,
    marginTop: Spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: Colors.sea, marginBottom: Spacing.sm },
  cardText: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  quickLinks: { paddingHorizontal: Spacing.sm },
  quickTitle: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginBottom: Spacing.sm },
  quickItem: { fontSize: 15, color: Colors.text, marginBottom: Spacing.xs },
});
