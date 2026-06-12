import { Redirect, router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, ApiError, formatReg, Overview } from '../src/api';
import { JobCard } from '../src/components/JobCard';
import { ErrorText, Loading, Plate } from '../src/components/ui';
import { useSession } from '../src/session';
import { colors, radius, spacing } from '../src/theme';

export default function Garage() {
  const { hydrated, customer, logoutCustomer } = useSession();
  const insets = useSafeAreaInsets();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!customer) return;
    try {
      setError('');
      setOverview(await api.overview(customer.id));
    } catch (e) {
      // The stored account no longer exists on the server — sign out cleanly.
      if (e instanceof ApiError && e.status === 404) {
        logoutCustomer();
        router.replace('/login');
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not load your garage');
    }
  }, [customer, logoutCustomer]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!hydrated) return <Loading />;
  if (!customer) return <Redirect href="/login" />;

  const activeCount =
    overview?.vehicles.reduce(
      (n, v) => n + v.jobs.filter((j) => j.stage_index < (overview?.stages.length ?? 6) - 1).length,
      0
    ) ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing(3) }]}>
        <Image
          source={require('../assets/pitlane-wordmark.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Pressable
          onPress={() => {
            logoutCustomer();
            router.replace('/login');
          }}
          style={styles.signOut}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing(5), paddingBottom: insets.bottom + spacing(8) }}
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
        <Text style={styles.hello}>Hi, {customer.name.split(' ')[0]}</Text>
        <Text style={styles.helloSub}>
          {activeCount > 0
            ? `${activeCount} ${activeCount === 1 ? 'service' : 'services'} in progress at the workshop`
            : 'No active services right now'}
        </Text>

        {error ? (
          <View style={{ marginTop: spacing(5) }}>
            <ErrorText>{error}</ErrorText>
          </View>
        ) : null}

        {!overview && !error ? (
          <Loading />
        ) : (
          overview?.vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.vehicleBlock}>
              <View style={styles.vehicleHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vehicleName}>
                    {vehicle.make} {vehicle.model}
                  </Text>
                  <Text style={styles.vehicleMeta}>
                    {[vehicle.year, vehicle.color].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Plate reg={formatReg(vehicle.reg_no)} />
              </View>

              {vehicle.jobs.length === 0 ? (
                <View style={styles.emptyJobs}>
                  <Text style={styles.emptyJobsText}>No services yet for this vehicle</Text>
                </View>
              ) : (
                <View style={{ gap: spacing(3) }}>
                  {vehicle.jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      stages={overview.stages}
                      onPress={() => router.push(`/job/${job.id}`)}
                    />
                  ))}
                </View>
              )}
            </View>
          ))
        )}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  headerLogo: { width: 132, height: 30 },
  signOut: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  signOutText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  hello: { color: colors.white, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  helloSub: { color: colors.muted, fontSize: 14, marginTop: spacing(1) },
  vehicleBlock: { marginTop: spacing(7) },
  vehicleHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    marginBottom: spacing(3),
  },
  vehicleName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  vehicleMeta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  emptyJobs: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
    padding: spacing(5),
    alignItems: 'center',
  },
  emptyJobsText: { color: colors.muted, fontSize: 13 },
});
