import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/Theme';
import { useTrip } from '@/context/TripContext';
import { FAMILIES } from '@/constants/Families';
import { formatDateLabel } from '@/utils/dates';
import type { DaySchedule, ScheduleEvent } from '@/types/trip';
import { emptyDaySchedule, formatFlightInfo } from '@/types/trip';

const LOCATIONS: { value: string; label: string }[] = [
  { value: '', label: '—' },
  { value: 'santorini', label: 'Santorini' },
  { value: 'crete', label: 'Crete' },
  { value: 'travel', label: 'Travel' },
];

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { tripData, updateDaySchedule } = useTrip();
  const familyList = tripData.families && tripData.families.length > 0 ? tripData.families : FAMILIES;
  const [day, setDay] = useState<DaySchedule>(emptyDaySchedule());

  useEffect(() => {
    if (date && tripData.scheduleByDay[date]) {
      const d = tripData.scheduleByDay[date];
      setDay({
        location: d.location ?? '',
        groupEvents: d.groupEvents ?? [],
        familyEvents: d.familyEvents ?? {},
      });
    } else {
      setDay(emptyDaySchedule());
    }
  }, [date, tripData.scheduleByDay]);

  const save = () => {
    if (date) {
      updateDaySchedule(date, day);
      router.back();
    }
  };

  const updateLocation = (location: string) => setDay((prev) => ({ ...prev, location: location as DaySchedule['location'] }));

  const updateGroupEvent = (index: number, field: keyof ScheduleEvent, value: string) => {
    setDay((prev) => {
      const list = [...(prev.groupEvents ?? [])];
      if (!list[index]) list[index] = { day: '', time: '', title: '', note: '' };
      list[index] = { ...list[index], [field]: value };
      return { ...prev, groupEvents: list };
    });
  };

  const addGroupEvent = () => {
    setDay((prev) => ({
      ...prev,
      groupEvents: [...(prev.groupEvents ?? []), { day: '', time: '', title: '', note: '' }],
    }));
  };

  const removeGroupEvent = (index: number) => {
    setDay((prev) => ({
      ...prev,
      groupEvents: prev.groupEvents.filter((_, i) => i !== index),
    }));
  };

  const updateFamilyEvent = (familyId: string, index: number, field: keyof ScheduleEvent, value: string) => {
    setDay((prev) => {
      const fe = { ...(prev.familyEvents ?? {}) };
      const list = [...(fe[familyId] ?? [])];
      if (!list[index]) list[index] = { day: '', time: '', title: '', note: '' };
      list[index] = { ...list[index], [field]: value };
      fe[familyId] = list;
      return { ...prev, familyEvents: fe };
    });
  };

  const addFamilyEvent = (familyId: string) => {
    setDay((prev) => {
      const fe = { ...(prev.familyEvents ?? {}) };
      fe[familyId] = [...(fe[familyId] ?? []), { day: '', time: '', title: '', note: '' }];
      return { ...prev, familyEvents: fe };
    });
  };

  const removeFamilyEvent = (familyId: string, index: number) => {
    setDay((prev) => {
      const fe = { ...prev.familyEvents };
      fe[familyId] = (fe[familyId] ?? []).filter((_, i) => i !== index);
      return { ...prev, familyEvents: fe };
    });
  };

  if (!date) return null;

  const flightDates = tripData.flightDates ?? {};
  const familiesWithFlightsToday = familyList.filter((f) => {
    const fd = flightDates[f.id];
    return fd && ((fd.departure === date) || (fd.return === date));
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{formatDateLabel(date)}</Text>

        {familiesWithFlightsToday.length > 0 && (
          <View style={styles.flightsSection}>
            <Text style={styles.sectionLabel}>Flights this day</Text>
            {familiesWithFlightsToday.map((f) => (
              <View key={f.id} style={styles.eventCard}>
                <Text style={styles.eventTitle}>{f.name}</Text>
                <Text style={styles.eventNote}>{tripData.flights[f.id] ? formatFlightInfo(tripData.flights[f.id]) : 'See Travel tab'}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionLabel}>Location</Text>
        <View style={styles.locationRow}>
          {LOCATIONS.map((loc) => (
            <TouchableOpacity
              key={loc.value}
              style={[styles.locationChip, day.location === loc.value && styles.locationChipActive]}
              onPress={() => updateLocation(loc.value)}
            >
              <Text style={[styles.locationChipText, day.location === loc.value && styles.locationChipTextActive]}>
                {loc.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>Everyone together</Text>
        <Text style={styles.hint}>Group events for this day (all families).</Text>
        {(day.groupEvents ?? []).map((ev, i) => (
          <View key={i} style={styles.eventCard}>
            <View style={styles.eventRow}>
              <TextInput
                style={[styles.input, styles.inputTitle]}
                value={ev.title}
                onChangeText={(v) => updateGroupEvent(i, 'title', v)}
                placeholder="Title"
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity onPress={() => removeGroupEvent(i)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.inputSmall]}
              value={ev.time}
              onChangeText={(v) => updateGroupEvent(i, 'time', v)}
              placeholder="Time"
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              style={[styles.input, styles.inputNote]}
              value={ev.note}
              onChangeText={(v) => updateGroupEvent(i, 'note', v)}
              placeholder="Note"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
          </View>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={addGroupEvent}>
          <Text style={styles.addBtnText}>+ Add group event</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>Per-family plans</Text>
        <Text style={styles.hint}>Things each family is doing alone (before/after group time).</Text>
        {familyList.map((family) => {
          const events = day.familyEvents?.[family.id] ?? [];
          return (
            <View key={family.id} style={styles.familyBlock}>
              <Text style={styles.familyName}>{family.name}</Text>
              {events.map((ev, i) => (
                <View key={i} style={styles.eventCard}>
                  <View style={styles.eventRow}>
                    <TextInput
                      style={[styles.input, styles.inputTitle]}
                      value={ev.title}
                      onChangeText={(v) => updateFamilyEvent(family.id, i, 'title', v)}
                      placeholder="Title"
                      placeholderTextColor={Colors.textMuted}
                    />
                    <TouchableOpacity onPress={() => removeFamilyEvent(family.id, i)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.input, styles.inputSmall]}
                    value={ev.time}
                    onChangeText={(v) => updateFamilyEvent(family.id, i, 'time', v)}
                    placeholder="Time"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <TextInput
                    style={[styles.input, styles.inputNote]}
                    value={ev.note}
                    onChangeText={(v) => updateFamilyEvent(family.id, i, 'note', v)}
                    placeholder="Note"
                    placeholderTextColor={Colors.textMuted}
                    multiline
                  />
                </View>
              ))}
              <TouchableOpacity style={styles.addBtnSmall} onPress={() => addFamilyEvent(family.id)}>
                <Text style={styles.addBtnText}>+ Add for {family.name}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveBtnText}>Save day</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl * 2 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.sea, marginBottom: Spacing.lg },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
  hint: { fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.sm },
  locationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  locationChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  locationChipActive: { backgroundColor: Colors.sea, borderColor: Colors.sea },
  locationChipText: { fontSize: 14, color: Colors.text },
  locationChipTextActive: { color: Colors.white, fontWeight: '600' },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  eventRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  input: { fontSize: 14, color: Colors.text, padding: 0 },
  inputTitle: { flex: 1, fontWeight: '600' },
  inputSmall: { marginTop: 4, marginBottom: 4 },
  inputNote: { fontSize: 13, color: Colors.textMuted, minHeight: 36 },
  removeBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  removeBtnText: { fontSize: 12, color: Colors.terracotta },
  addBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
  },
  addBtnSmall: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, marginTop: 4, marginBottom: Spacing.md },
  addBtnText: { fontSize: 14, color: Colors.sea, fontWeight: '500' },
  familyBlock: { marginBottom: Spacing.md },
  familyName: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  flightsSection: { marginBottom: Spacing.lg },
  footer: { marginTop: Spacing.xl },
  saveBtn: {
    backgroundColor: Colors.sea,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
