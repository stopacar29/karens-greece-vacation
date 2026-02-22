import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors, Spacing } from '@/constants/Theme';
import { FAMILIES } from '@/constants/Families';
import { useTrip } from '@/context/TripContext';
import type { Family } from '@/constants/Families';

const PLACEHOLDER_ACC = 'Hotel/villa name, check-in & out, booking code';
const PLACEHOLDER_TO = 'Departure — pickup time, driver, confirmation #';
const PLACEHOLDER_FROM = 'Arrival — pickup point, driver, confirmation #';

function FamilyCard({
  family,
  title,
  value,
  placeholder,
  onChangeText,
  multiline,
}: {
  family: Family;
  title?: string;
  value: string;
  placeholder: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.familyName}>{family.name}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        multiline={multiline}
      />
    </View>
  );
}

export default function TravelScreen() {
  const { tripData, updateTrip } = useTrip();
  const familyList = tripData.families && tripData.families.length > 0 ? tripData.families : FAMILIES;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Flights (by family)</Text>
        <Text style={styles.hint}>Travel dates below so flights show on the Schedule for that day.</Text>
        {familyList.map((family) => {
          const fd = tripData.flightDates?.[family.id] ?? { departure: '', return: '' };
          const fl = tripData.flights[family.id];
          const airline = fl?.airline ?? '';
          const flightNumber = fl?.flightNumber ?? '';
          const departureAirport = fl?.departureAirport ?? '';
          const departureTime = fl?.departureTime ?? '';
          const arrivalAirport = fl?.arrivalAirport ?? '';
          const arrivalTime = fl?.arrivalTime ?? '';
          const updateFlight = (field: 'airline' | 'flightNumber' | 'departureAirport' | 'departureTime' | 'arrivalAirport' | 'arrivalTime', value: string) =>
            updateTrip({
              flights: {
                ...tripData.flights,
                [family.id]: { airline, flightNumber, departureAirport, departureTime, arrivalAirport, arrivalTime, [field]: value },
              },
            });
          return (
            <View key={family.id} style={styles.card}>
              <Text style={styles.familyName}>{family.name}</Text>
              <View style={styles.flightRow}>
                <Text style={styles.flightLabel}>Airline</Text>
                <TextInput style={styles.flightInput} value={airline} onChangeText={(v) => updateFlight('airline', v)} placeholder="e.g. Delta" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.flightRow}>
                <Text style={styles.flightLabel}>Flight number</Text>
                <TextInput style={styles.flightInput} value={flightNumber} onChangeText={(v) => updateFlight('flightNumber', v)} placeholder="e.g. 123" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.flightRow}>
                <Text style={styles.flightLabel}>Departure airport (code)</Text>
                <TextInput style={styles.flightInput} value={departureAirport} onChangeText={(v) => updateFlight('departureAirport', v.toUpperCase().slice(0, 3))} placeholder="e.g. JFK" placeholderTextColor={Colors.textMuted} autoCapitalize="characters" />
              </View>
              <View style={styles.flightRow}>
                <Text style={styles.flightLabel}>Departure time</Text>
                <TextInput style={styles.flightInput} value={departureTime} onChangeText={(v) => updateFlight('departureTime', v)} placeholder="HH:MM AM or PM" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.flightRow}>
                <Text style={styles.flightLabel}>Arrival airport (code)</Text>
                <TextInput style={styles.flightInput} value={arrivalAirport} onChangeText={(v) => updateFlight('arrivalAirport', v.toUpperCase().slice(0, 3))} placeholder="e.g. ATH" placeholderTextColor={Colors.textMuted} autoCapitalize="characters" />
              </View>
              <View style={styles.flightRow}>
                <Text style={styles.flightLabel}>Arrival time</Text>
                <TextInput style={styles.flightInput} value={arrivalTime} onChangeText={(v) => updateFlight('arrivalTime', v)} placeholder="HH:MM AM or PM" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.flightDateRow}>
                <Text style={styles.flightDateLabel}>Departure date</Text>
                <TextInput style={styles.dateInput} value={fd.departure} onChangeText={(v) => updateTrip({ flightDates: { ...tripData.flightDates, [family.id]: { ...fd, departure: v } } })} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>
          );
        })}

        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>Santorini (by family)</Text>
        <Text style={styles.hint}>Where each family is staying in Santorini.</Text>
        {familyList.map((family) => (
          <FamilyCard
            key={`s-${family.id}`}
            family={family}
            value={tripData.accommodationSantorini[family.id] ?? ''}
            placeholder={PLACEHOLDER_ACC}
            onChangeText={(v) =>
              updateTrip({ accommodationSantorini: { ...tripData.accommodationSantorini, [family.id]: v } })
            }
            multiline
          />
        ))}

        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>Crete (by family)</Text>
        <Text style={styles.hint}>Where each family is staying in Crete.</Text>
        {familyList.map((family) => (
          <FamilyCard
            key={`c-${family.id}`}
            family={family}
            value={tripData.accommodationCrete[family.id] ?? ''}
            placeholder={PLACEHOLDER_ACC}
            onChangeText={(v) =>
              updateTrip({ accommodationCrete: { ...tripData.accommodationCrete, [family.id]: v } })
            }
            multiline
          />
        ))}

        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>Airport transfers (by family)</Text>
        <Text style={styles.hint}>To and from the airport.</Text>
        {familyList.map((family) => {
          const t = tripData.transfers[family.id];
          return (
            <View key={`transfer-${family.id}`} style={styles.card}>
              <Text style={styles.familyName}>{family.name}</Text>
              <Text style={styles.transferLabel}>To airport</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={t?.toAirport ?? ''}
                onChangeText={(v) =>
                  updateTrip({
                    transfers: {
                      ...tripData.transfers,
                      [family.id]: { ...t, toAirport: v, fromAirport: t?.fromAirport ?? '' },
                    },
                  })
                }
                placeholder={PLACEHOLDER_TO}
                placeholderTextColor={Colors.textMuted}
                multiline
              />
              <Text style={[styles.transferLabel, { marginTop: Spacing.sm }]}>From airport</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={t?.fromAirport ?? ''}
                onChangeText={(v) =>
                  updateTrip({
                    transfers: {
                      ...tripData.transfers,
                      [family.id]: { ...t, toAirport: t?.toAirport ?? '', fromAirport: v },
                    },
                  })
                }
                placeholder={PLACEHOLDER_FROM}
                placeholderTextColor={Colors.textMuted}
                multiline
              />
            </View>
          );
        })}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Getting around</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={tripData.gettingAround}
            onChangeText={(v) => updateTrip({ gettingAround: v })}
            placeholder="Transfers, car hire, boat details for the group."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important numbers</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={tripData.importantNumbers}
            onChangeText={(v) => updateTrip({ importantNumbers: v })}
            placeholder="Local emergency, villa/hotel contact, travel insurance."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl * 2 },
  sectionLabel: { fontSize: 18, fontWeight: '700', color: Colors.sea, marginBottom: Spacing.xs },
  hint: { fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.md },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  familyName: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  flightRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  flightLabel: { width: 160, fontSize: 13, color: Colors.textMuted },
  flightInput: { flex: 1, backgroundColor: Colors.cream, borderRadius: 8, padding: Spacing.sm, fontSize: 14, color: Colors.text },
  flightDateRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  flightDateLabel: { width: 120, fontSize: 13, color: Colors.textMuted },
  dateInput: {
    flex: 1,
    backgroundColor: Colors.cream,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: 13,
    color: Colors.text,
  },
  transferLabel: { fontSize: 13, fontWeight: '600', color: Colors.sea },
  input: { fontSize: 14, color: Colors.text, padding: 0, minHeight: 22 },
  inputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.sea, marginBottom: Spacing.sm },
});
