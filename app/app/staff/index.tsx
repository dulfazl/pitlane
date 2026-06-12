import { Redirect, router, useFocusEffect } from 'expo-router';
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
import { api, formatReg, Stage, StaffJobRow } from '../../src/api';
import { Chip, ErrorText, Loading, Plate } from '../../src/components/ui';
import { useSession } from '../../src/session';
import { colors, radius, spacing } from '../../src/theme';

export default function StaffBoard() {
  const { hydrated, staffPin, logoutStaff } = useSession();
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState<StaffJobRow[] | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!staffPin) return;
    try {
      setError('');
      const data = await api.staff.jobs(staffPin, showAll);
      setJobs(data.jobs);
      setStages(data.stages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load jobs');
    }
  }, [staffPin, showAll]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!hydrated) return <Loading />;
  if (!staffPin) return <Redirect href="/staff/login" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing(3) }]}>
        <View>
          <Text style={styles.headerTitle}>Workshop Board</Text>
          <Text style={styles.headerSub}>PITLANE Staff</Text>
        </View>
        <Pressable
          onPress={() => {
            logoutStaff();
            router.replace('/login');
          }}
          style={styles.signOut}
        >
          <Text style={styles.signOutText}>Exit staff</Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        <Chip label="Active" active={!showAll} onPress={() => setShowAll(false)} />
        <Chip label="All jobs" active={showAll} onPress={() => setShowAll(true)} />
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => router.push('/staff/new-job')} style={styles.newJob}>
          <Text style={styles.newJobText}>+ New Job</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing(5), paddingTop: 0, paddingBottom: insets.bottom + spacing(8) }}
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
        {error ? <ErrorText>{error}</ErrorText> : null}
        {!jobs && !error ? <Loading /> : null}

        {jobs?.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No {showAll ? '' : 'active '}jobs on the board.</Text>
          </View>
        ) : null}

        <View style={{ gap: spacing(3) }}>
          {jobs?.map((job) => {
            const isDelivered = job.stage_index >= stages.length - 1;
            return (
              <Pressable
                key={job.id}
                onPress={() => router.push(`/staff/job/${job.id}`)}
                style={({ pressed }) => [styles.jobRow, pressed && { opacity: 0.85 }]}
              >
                <View style={styles.jobTop}>
                  <Plate reg={formatReg(job.reg_no)} />
                  <View style={[styles.stageBadge, isDelivered && { backgroundColor: colors.greenDim }]}>
                    <Text style={[styles.stageBadgeText, isDelivered && { color: colors.green }]}>
                      {stages[job.stage_index]?.label ?? '—'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.jobService}>{job.service_type}</Text>
                <Text style={styles.jobMeta}>
                  {job.make} {job.model} · {job.customer_name} · {job.customer_phone}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
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
  },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  headerSub: { color: colors.orange, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  signOut: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  signOutText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(3),
  },
  newJob: {
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
  },
  newJobText: { color: '#000000', fontSize: 13, fontWeight: '800' },
  empty: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: spacing(8),
    alignItems: 'center',
    marginTop: spacing(4),
  },
  emptyText: { color: colors.muted, fontSize: 14 },
  jobRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stageBadge: {
    backgroundColor: colors.orangeDim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
  },
  stageBadgeText: { color: colors.orange, fontSize: 11, fontWeight: '800' },
  jobService: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: spacing(2.5) },
  jobMeta: { color: colors.muted, fontSize: 13, marginTop: spacing(1) },
});
