import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stage } from '../api';
import { colors, spacing } from '../theme';

export function StageTimeline({ stages, currentIndex }: { stages: Stage[]; currentIndex: number }) {
  return (
    <View>
      {stages.map((stage, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === stages.length - 1;
        return (
          <View key={stage.key} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  isDone && styles.dotDone,
                  isCurrent && styles.dotCurrent,
                ]}
              >
                {isDone && <Text style={styles.check}>✓</Text>}
                {isCurrent && <View style={styles.dotCore} />}
              </View>
              {!isLast && <View style={[styles.line, isDone && { backgroundColor: colors.orange }]} />}
            </View>
            <View style={[styles.labelWrap, isLast && { paddingBottom: 0 }]}>
              <Text
                style={[
                  styles.label,
                  isDone && { color: colors.text },
                  isCurrent && styles.labelCurrent,
                ]}
              >
                {stage.label}
              </Text>
              {isCurrent && <Text style={styles.now}>IN PROGRESS</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { width: 28, alignItems: 'center' },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.orange, borderColor: colors.orange },
  dotCurrent: { borderColor: colors.orange, backgroundColor: colors.surface },
  dotCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.orange },
  check: { color: '#000000', fontSize: 12, fontWeight: '900', lineHeight: 14 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  labelWrap: { flex: 1, paddingLeft: spacing(3), paddingBottom: spacing(6) },
  label: { color: colors.muted, fontSize: 15, fontWeight: '600', lineHeight: 24 },
  labelCurrent: { color: colors.orange, fontWeight: '800' },
  now: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 2 },
});
