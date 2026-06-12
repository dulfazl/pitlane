import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDate, JobSummary, Stage } from '../api';
import { colors, radius, spacing } from '../theme';
import { ProgressBar } from './ui';

export function JobCard({
  job,
  stages,
  onPress,
  subtitle,
}: {
  job: JobSummary;
  stages: Stage[];
  onPress: () => void;
  subtitle?: string;
}) {
  const lastIndex = stages.length - 1;
  const isDelivered = job.stage_index >= lastIndex;
  const progress = lastIndex > 0 ? job.stage_index / lastIndex : 0;
  const stageLabel = stages[job.stage_index]?.label ?? '—';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.topRow}>
        <Text style={styles.service}>{job.service_type}</Text>
        <View style={[styles.badge, isDelivered && styles.badgeDone]}>
          <Text style={[styles.badgeText, isDelivered && { color: colors.green }]}>{stageLabel}</Text>
        </View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={{ marginTop: spacing(3) }}>
        <ProgressBar progress={progress} />
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.meta}>
          {typeof job.tasks_done === 'number' && typeof job.tasks_total === 'number' && job.tasks_total > 0
            ? `${job.tasks_done}/${job.tasks_total} tasks done`
            : `Started ${formatDate(job.created_at)}`}
        </Text>
        {job.estimated_delivery && !isDelivered ? (
          <Text style={styles.meta}>Est. {formatDate(job.estimated_delivery)}</Text>
        ) : null}
        {isDelivered && job.completed_at ? (
          <Text style={[styles.meta, { color: colors.green }]}>Delivered {formatDate(job.completed_at)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing(2) },
  service: { color: colors.text, fontSize: 16, fontWeight: '800', flexShrink: 1 },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: spacing(1) },
  badge: {
    backgroundColor: colors.orangeDim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
  },
  badgeDone: { backgroundColor: colors.greenDim },
  badgeText: { color: colors.orange, fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing(2.5),
    gap: spacing(2),
  },
  meta: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});
