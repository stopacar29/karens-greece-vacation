import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Colors, Spacing } from '@/constants/Theme';
import { useTrip } from '@/context/TripContext';
import { FAMILIES } from '@/constants/Families';
import { MonthCalendar } from '@/components/MonthCalendar';
import { SelectedDayPanel } from '@/components/SelectedDayPanel';
import { emptyDaySchedule } from '@/types/trip';

export default function ScheduleScreen() {
  const { tripData, updateTrip } = useTrip();
  const familyList = tripData.families && tripData.families.length > 0 ? tripData.families : FAMILIES;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const tripStart = tripData.tripStartDate || '2026-07-09';
  const tripEnd = tripData.tripEndDate || '2026-08-08';

  const startParsed = useMemo(() => {
    if (!tripStart) return { year: 2026, month: 7 };
    const [y, m] = tripStart.split('-').map(Number);
    return { year: y, month: m };
  }, [tripStart]);

  const [viewYear, setViewYear] = useState(startParsed.year);
  const [viewMonth, setViewMonth] = useState(startParsed.month);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectedDaySchedule = selectedDate
    ? (tripData.scheduleByDay[selectedDate] ?? emptyDaySchedule())
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Full month view: tap a day in the calendar to see its details below. Use arrows to change month.
      </Text>

      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Trip start</Text>
        <TextInput
          style={styles.dateInput}
          value={tripData.tripStartDate}
          onChangeText={(v) => updateTrip({ tripStartDate: v })}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.textMuted}
        />
      </View>
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Trip end</Text>
        <TextInput
          style={styles.dateInput}
          value={tripData.tripEndDate}
          onChangeText={(v) => updateTrip({ tripEndDate: v })}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <MonthCalendar
        year={viewYear}
        month={viewMonth}
        selectedDate={selectedDate}
        tripStart={tripStart}
        tripEnd={tripEnd}
        onSelectDate={setSelectedDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {selectedDate ? (
        <SelectedDayPanel
          date={selectedDate}
          day={
            selectedDaySchedule ?? {
              location: '',
              groupEvents: [],
              familyEvents: {},
            }
          }
          familyNames={familyList.map((f) => ({ id: f.id, name: f.name }))}
          flights={tripData.flights}
          flightDates={tripData.flightDates}
        />
      ) : (
        <Text style={styles.tapHint}>Tap a day in the calendar to see its details.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl * 2 },
  intro: { fontSize: 14, color: Colors.textMuted, marginBottom: Spacing.lg, lineHeight: 20 },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  dateLabel: { width: 90, fontSize: 14, color: Colors.text },
  dateInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: Spacing.sm,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tapHint: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.sm },
});
