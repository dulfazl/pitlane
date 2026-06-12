import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, formatDate, formatDateTime, formatMoney, formatReg, JobDetail } from '../../src/api';
import { StageTimeline } from '../../src/components/StageTimeline';
import { Card, ErrorText, Label, Loading, Plate, ProgressBar } from '../../src/components/ui';
import { colors, radius, spacing } from '../../src/theme';

export default function JobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      setJob(await api.job(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this service');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const lastIndex = job ? job.stages.length - 1 : 5;
  const progress = job ? job.stage_index / lastIndex : 0;
  const isDelivered = job ? job.stage_index >= lastIndex : false;
  const doneTasks = job?.tasks.filter((t) => t.done).length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing(3) }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Service Tracking</Text>
        <View style={{ width: 64 }} />
      </View>

      {!job && !error ? <Loading /> : null}
      {error ? (
        <View style={{ padding: spacing(5) }}>
          <ErrorText>{error}</ErrorText>
        </View>
      ) : null}

      {job ? (
        <ScrollView
          contentContainerStyle={{ padding: spacing(5), paddingBottom: insets.bottom + spacing(10) }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.orange}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }
        >
          <Card>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.service}>{job.service_type}</Text>
                <Text style={styles.vehicle}>
                  {job.make} {job.model}
                </Text>
              </View>
              <Plate reg={formatReg(job.reg_no)} />
            </View>
            {job.description ? <Text style={styles.description}>{job.description}</Text> : null}

            <View style={{ marginTop: spacing(4) }}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>
                  {isDelivered ? 'Delivered' : job.stages[job.stage_index]?.label}
                </Text>
                <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
              </View>
              <ProgressBar progress={progress} />
            </View>

            <View style={styles.factsRow}>
              {job.estimated_delivery ? (
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>EST. DELIVERY</Text>
                  <Text style={styles.factValue}>{formatDate(job.estimated_delivery)}</Text>
                </View>
              ) : null}
              {job.cost_estimate ? (
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>ESTIMATE</Text>
                  <Text style={styles.factValue}>{formatMoney(job.cost_estimate)}</Text>
                </View>
              ) : null}
              <View style={styles.fact}>
                <Text style={styles.factLabel}>RECEIVED</Text>
                <Text style={styles.factValue}>{formatDate(job.created_at)}</Text>
              </View>
            </View>
          </Card>

          <View style={styles.section}>
            <Label>Progress</Label>
            <Card>
              <StageTimeline stages={job.stages} currentIndex={job.stage_index} />
            </Card>
          </View>

          {job.tasks.length > 0 ? (
            <View style={styles.section}>
              <Label>
                Work checklist · {doneTasks}/{job.tasks.length}
              </Label>
              <Card style={{ gap: spacing(3) }}>
                {job.tasks.map((task) => (
                  <View key={task.id} style={styles.taskRow}>
                    <View style={[styles.taskBox, task.done === 1 && styles.taskBoxDone]}>
                      {task.done === 1 ? <Text style={styles.taskCheck}>✓</Text> : null}
                    </View>
                    <Text style={[styles.taskTitle, task.done === 1 && styles.taskTitleDone]}>
                      {task.title}
                    </Text>
                  </View>
                ))}
              </Card>
            </View>
          ) : null}

          <View style={styles.section}>
            <Label>Updates from the workshop</Label>
            <View style={{ gap: spacing(3) }}>
              {job.updates.map((u) => (
                <Card key={u.id}>
                  <View style={styles.updateHead}>
                    <Text style={styles.updateStage}>{job.stages[u.stage_index]?.label ?? ''}</Text>
                    <Text style={styles.updateTime}>{formatDateTime(u.created_at)}</Text>
                  </View>
                  <Text style={styles.updateMsg}>{u.message}</Text>
                  <Text style={styles.updateBy}>— {u.created_by}</Text>
                </Card>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { width: 64 },
  backText: { color: colors.orange, fontSize: 16, fontWeight: '700' },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing(3) },
  service: { color: colors.white, fontSize: 20, fontWeight: '900' },
  vehicle: { color: colors.muted, fontSize: 14, marginTop: 2 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing(3) },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing(2) },
  progressLabel: { color: colors.orange, fontSize: 13, fontWeight: '800' },
  progressPct: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  factsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(4),
    marginTop: spacing(4),
    paddingTop: spacing(4),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fact: { minWidth: 90 },
  factLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  factValue: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 2 },
  section: { marginTop: spacing(6) },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  taskBox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskBoxDone: { backgroundColor: colors.orange, borderColor: colors.orange },
  taskCheck: { color: '#000000', fontSize: 13, fontWeight: '900', lineHeight: 15 },
  taskTitle: { color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 },
  taskTitleDone: { color: colors.muted, textDecorationLine: 'line-through' },
  updateHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing(2) },
  updateStage: { color: colors.orange, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  updateTime: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  updateMsg: { color: colors.text, fontSize: 14, lineHeight: 21 },
  updateBy: { color: colors.muted, fontSize: 12, marginTop: spacing(2), fontStyle: 'italic' },
});
