import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing } from '@/constants/Theme';
import { FAMILIES } from '@/constants/Families';

export default function GuestsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Everyone on the trip, by family. Add contact info or room assignments as you lock them in.
      </Text>
      {FAMILIES.map((family) => (
        <View key={family.id} style={styles.familyCard}>
          <Text style={styles.familyName}>{family.name}</Text>
          {family.members.map((member, i) => (
            <View key={i} style={styles.memberRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                {member.note ? <Text style={styles.memberNote}>{member.note}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl * 2 },
  intro: { fontSize: 14, color: Colors.textMuted, marginBottom: Spacing.lg },
  familyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  familyName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.sea,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: Colors.goldLight,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.seaLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, color: Colors.text, fontWeight: '500' },
  memberNote: { fontSize: 13, color: Colors.textMuted, marginTop: 1 },
});
