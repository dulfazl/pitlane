import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function formatPretty(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const QUICK = [
  { label: 'Tomorrow', days: 1 },
  { label: '+3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
];

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
}: {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}) {
  const today = useMemo(() => new Date(), []);
  const todayKey = toKey(today);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() =>
    value ? Number(value.slice(0, 4)) : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() =>
    value ? Number(value.slice(5, 7)) - 1 : today.getMonth()
  );

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function pick(key: string) {
    onChange(key);
    setOpen(false);
    setViewYear(Number(key.slice(0, 4)));
    setViewMonth(Number(key.slice(5, 7)) - 1);
  }

  const cells = useMemo(() => {
    const lead = new Date(viewYear, viewMonth, 1).getDay();
    const count = new Date(viewYear, viewMonth + 1, 0).getDate();
    const out: (string | null)[] = Array(lead).fill(null);
    for (let day = 1; day <= count; day++) {
      out.push(toKey(new Date(viewYear, viewMonth, day)));
    }
    return out;
  }, [viewYear, viewMonth]);

  return (
    <View>
      <Pressable
        onPress={() => setOpen(!open)}
        style={[styles.field, open && { borderColor: colors.orange }]}
      >
        <Text style={[styles.fieldText, !value && { color: colors.muted }]}>
          {value ? formatPretty(value) : placeholder}
        </Text>
        <Text style={styles.fieldIcon}>{open ? '▴' : '▾'}</Text>
      </Pressable>

      {open ? (
        <View style={styles.panel}>
          <View style={styles.quickRow}>
            {QUICK.map((q) => {
              const key = toKey(addDays(today, q.days));
              return (
                <Pressable
                  key={q.label}
                  onPress={() => pick(key)}
                  style={[styles.quickChip, value === key && styles.quickChipActive]}
                >
                  <Text style={[styles.quickText, value === key && { color: colors.orange }]}>
                    {q.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.monthRow}>
            <Pressable onPress={() => shiftMonth(-1)} style={styles.navBtn} hitSlop={8}>
              <Text style={styles.navText}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <Pressable onPress={() => shiftMonth(1)} style={styles.navBtn} hitSlop={8}>
              <Text style={styles.navText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.grid}>
            {WEEKDAYS.map((w, i) => (
              <View key={`w${i}`} style={styles.cell}>
                <Text style={styles.weekday}>{w}</Text>
              </View>
            ))}
            {cells.map((key, i) => {
              if (!key) return <View key={`b${i}`} style={styles.cell} />;
              const isPast = key < todayKey;
              const isSelected = key === value;
              const isToday = key === todayKey;
              return (
                <View key={key} style={styles.cell}>
                  <Pressable
                    disabled={isPast}
                    onPress={() => pick(key)}
                    style={[styles.day, isSelected && styles.daySelected, isToday && !isSelected && styles.dayToday]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isPast && { color: '#3A3A3A' },
                        isSelected && { color: '#000000', fontWeight: '900' },
                        isToday && !isSelected && { color: colors.orange },
                      ]}
                    >
                      {Number(key.slice(8, 10))}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {value ? (
            <Pressable onPress={() => { onChange(''); setOpen(false); }} style={styles.clear}>
              <Text style={styles.clearText}>Clear date</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldText: { color: colors.text, fontSize: 16 },
  fieldIcon: { color: colors.orange, fontSize: 14 },
  panel: {
    marginTop: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    padding: spacing(3),
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginBottom: spacing(3) },
  quickChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  quickChipActive: { borderColor: colors.orange, backgroundColor: colors.orangeDim },
  quickText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(2),
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: { color: colors.orange, fontSize: 18, fontWeight: '800', lineHeight: 20 },
  monthLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  weekday: { color: colors.muted, fontSize: 11, fontWeight: '800', paddingVertical: spacing(1) },
  day: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: { backgroundColor: colors.orange },
  dayToday: { borderWidth: 1, borderColor: colors.orange },
  dayText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  clear: { alignSelf: 'center', padding: spacing(2), marginTop: spacing(1) },
  clearText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
});
