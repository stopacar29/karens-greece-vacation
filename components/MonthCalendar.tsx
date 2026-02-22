import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '@/constants/Theme';
import { getMonthGrid, getMonthYearLabel, isDateInRange } from '@/utils/dates';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Props = {
  year: number;
  month: number;
  selectedDate: string | null;
  tripStart: string;
  tripEnd: string;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export function MonthCalendar({
  year,
  month,
  selectedDate,
  tripStart,
  tripEnd,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const grid = getMonthGrid(year, month);
  const title = getMonthYearLabel(year, month);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.arrow} hitSlop={12}>
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.arrow} hitSlop={12}>
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekday} numberOfLines={1}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {grid.map((date, i) => {
          const isInRange = date ? isDateInRange(date, tripStart, tripEnd) : false;
          const isSelected = date === selectedDate;
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.cell,
                !date && styles.cellEmpty,
                isInRange && styles.cellInRange,
                isSelected && styles.cellSelected,
              ]}
              onPress={() => date && isInRange && onSelectDate(date)}
              disabled={!date || !isInRange}
            >
              <Text
                style={[
                  styles.cellText,
                  !date && styles.cellTextEmpty,
                  isInRange && styles.cellTextInRange,
                  isSelected && styles.cellTextSelected,
                ]}
              >
                {date ? new Date(date + 'T12:00:00').getDate() : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const cellSize = 36;
const gap = 4;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  arrow: { padding: Spacing.sm, minWidth: 44, alignItems: 'center' },
  arrowText: { fontSize: 28, color: Colors.sea, fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  weekday: {
    width: cellSize + gap,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -gap / 2,
  },
  cell: {
    width: cellSize + gap,
    height: cellSize + gap,
    margin: gap / 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellEmpty: { backgroundColor: 'transparent' },
  cellInRange: { backgroundColor: Colors.cream },
  cellSelected: { backgroundColor: Colors.sea },
  cellText: { fontSize: 15, color: Colors.textMuted },
  cellTextEmpty: { color: 'transparent' },
  cellTextInRange: { color: Colors.text, fontWeight: '500' },
  cellTextSelected: { color: Colors.white, fontWeight: '700' },
});
