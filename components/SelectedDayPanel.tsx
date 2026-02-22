import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/Theme';
import { formatDateLabel } from '@/utils/dates';
import type { DaySchedule, FlightInfo } from '@/types/trip';
import { formatFlightInfo } from '@/types/trip';

const LOCATION_LABELS: Record<string, string> = {
  santorini: 'Santorini',
  crete: 'Crete',
  travel: 'Travel',
  '': '—',
};

type Props = {
  date: string;
  day: DaySchedule;
  familyNames: { id: string; name: string }[];
  flights?: Record<string, FlightInfo>;
  flightDates?: Record<string, { departure: string; return: string }>;
};

export function SelectedDayPanel({ date, day, familyNames, flights = {}, flightDates = {} }: Props) {
  const router = useRouter();
  const locationLabel = LOCATION_LABELS[day.location ?? ''] ?? '—';
  const groupEvents = day.groupEvents ?? [];
  const familyEvents = day.familyEvents ?? {};
  const familiesOnThisDay = familyNames.filter((f) => {
    const fd = flightDates[f.id];
    if (!fd) return false;
    return (fd.departure && fd.departure === date) || (fd.return && fd.return === date);
  });
  const hasContent =
    locationLabel !== '—' ||
    groupEvents.length > 0 ||
    Object.values(familyEvents).some((arr) => arr?.length > 0) ||
    familiesOnThisDay.length > 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>{formatDateLabel(date)}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/day/${date}` as any)}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
      {!hasContent ? (
        <Text style={styles.empty}>No plans yet. Tap Edit to add location, group events, or per-family plans.</Text>
      ) : (
        <>
          {familiesOnThisDay.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>Flights this day</Text>
              {familiesOnThisDay.map((f) => (
                <View key={f.id} style={styles.event}>
                  <Text style={styles.eventTitle}>{f.name}</Text>
                  <Text style={styles.eventNote}>{flights[f.id] ? formatFlightInfo(flights[f.id]) : 'Flight details in Travel tab'}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.section}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{locationLabel}</Text>
          </View>
          {groupEvents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>Everyone together</Text>
              {groupEvents.map((ev, i) => (
                <View key={i} style={styles.event}>
                  <Text style={styles.eventTitle}>{ev.title || '(No title)'}</Text>
                  {ev.time ? <Text style={styles.eventTime}>{ev.time}</Text> : null}
                  {ev.note ? <Text style={styles.eventNote}>{ev.note}</Text> : null}
                </View>
              ))}
            </View>
          )}
          {familyNames.map((family) => {
            const events = familyEvents[family.id] ?? [];
            if (events.length === 0) return null;
            return (
              <View key={family.id} style={styles.section}>
                <Text style={styles.label}>{family.name}</Text>
                {events.map((ev, i) => (
                  <View key={i} style={styles.event}>
                    <Text style={styles.eventTitle}>{ev.title || '(No title)'}</Text>
                    {ev.time ? <Text style={styles.eventTime}>{ev.time}</Text> : null}
                    {ev.note ? <Text style={styles.eventNote}>{ev.note}</Text> : null}
                  </View>
                ))}
              </View>
            );
          })}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  title: { fontSize: 18, fontWeight: '700', color: Colors.sea },
  editBtn: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  editBtnText: { fontSize: 14, fontWeight: '600', color: Colors.sea },
  empty: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },
  section: { marginTop: Spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginBottom: Spacing.xs },
  value: { fontSize: 15, color: Colors.text },
  event: {
    backgroundColor: Colors.cream,
    borderRadius: 10,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  eventTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  eventTime: { fontSize: 13, color: Colors.sea, marginTop: 2 },
  eventNote: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
});
