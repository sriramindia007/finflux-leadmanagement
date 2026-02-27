import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { api } from '../services/api';

const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

function CalendarStrip() {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - 3 + i);
    return { date: d.getDate(), day: DAYS[d.getDay()], isToday: i === 3 };
  });
  return (
    <View style={s.calendarRow}>
      {days.map((d, i) => (
        <View key={i} style={[s.dayItem, d.isToday && s.dayToday]}>
          <Text style={[s.dayLabel, d.isToday && s.dayLabelToday]}>{d.day}</Text>
          <Text style={[s.dayNum, d.isToday && s.dayNumToday]}>{d.date}</Text>
        </View>
      ))}
    </View>
  );
}

function DashboardCard({ label, count, amount, actionLabel, bg, onPress }) {
  return (
    <TouchableOpacity style={[s.dashCard, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.85}>
      <View style={s.dashAvatar}>
        <Ionicons name="person-circle" size={40} color={colors.primary} />
      </View>
      <Text style={s.dashLabel}>{label}</Text>
      <View style={s.dashStats}>
        <View>
          <Text style={s.dashCount}>{count}</Text>
          <Text style={s.dashSub}>Onboarding Tasks</Text>
        </View>
        {amount != null && (
          <View>
            <Text style={s.dashCount}>₹ {amount.toLocaleString()}</Text>
            <Text style={s.dashSub}>To Be Collected</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={s.dashBtn} onPress={onPress}>
        <Text style={s.dashBtnText}>{actionLabel} →</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const TASKS = [
  { id: 1, title: 'Vidyapura Center 1', time: '07:00 AM', type: 'Collection' },
  { id: 2, title: 'Vidyapura Center 2', time: '09:00 AM', type: 'Collection' },
];

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({ total: 0, approvalPending: 0, qualified: 0, converted: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const data = await api.getStats(); setStats(data); } catch (_) {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const today = new Date();

  return (
    <ScrollView style={s.screen} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good Morning</Text>
          <Text style={s.date}>Today is {today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</Text>
        </View>
        <TouchableOpacity style={s.profileBtn}>
          <Ionicons name="person-circle-outline" size={32} color={colors.navyText} />
        </TouchableOpacity>
      </View>

      <CalendarStrip />

      {/* Dashboard Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cardsScroll} contentContainerStyle={s.cardsContent}>
        <DashboardCard label="You're beginning Collections!" count={8} amount={123500} bg="#EBF5FF" actionLabel="Center List" onPress={() => {}} />
        <DashboardCard label="You have some things Sourcing today" count={8} amount={null} bg="#FEF3C7" actionLabel="View List" onPress={() => navigation.navigate('LeadsPool')} />
        <DashboardCard label="Leads to be met" count={stats.qualified} amount={3500} bg="#D1FAE5" actionLabel="Leads Pool" onPress={() => navigation.navigate('LeadsPool')} />
      </ScrollView>

      {/* Upcoming Tasks */}
      <Text style={s.sectionTitle}>Upcoming Tasks</Text>
      {TASKS.map(task => (
        <View key={task.id} style={s.taskCard}>
          <View style={s.taskLeft}>
            <Ionicons name="ellipse-outline" size={20} color={colors.pending} />
            <View style={s.taskInfo}>
              <Text style={s.taskTitle}>{task.title}</Text>
              <Text style={s.taskMeta}>{task.time} • {task.type}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.mapBtn}>
            <Ionicons name="navigate-outline" size={16} color={colors.primary} />
            <Text style={s.mapText}>Map</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  greeting: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.navyText },
  date: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  profileBtn: { padding: 4 },
  calendarRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: spacing.base, marginBottom: spacing.base },
  dayItem: { alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8, borderRadius: radius.sm },
  dayToday: { backgroundColor: colors.primary, borderRadius: radius.md },
  dayLabel: { fontSize: typography.sizes.xs, color: colors.textSecondary, fontWeight: typography.weights.medium },
  dayLabelToday: { color: colors.textWhite },
  dayNum: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold, color: colors.navyText, marginTop: 2 },
  dayNumToday: { color: colors.textWhite },
  cardsScroll: { marginBottom: spacing.base },
  cardsContent: { paddingHorizontal: spacing.base, gap: spacing.sm, paddingRight: spacing.xl },
  dashCard: { width: 200, borderRadius: radius.lg, padding: spacing.base, ...shadows.card },
  dashAvatar: { marginBottom: spacing.sm },
  dashLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.navyText, marginBottom: spacing.sm },
  dashStats: { flexDirection: 'row', gap: spacing.base, marginBottom: spacing.sm },
  dashCount: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.navyText },
  dashSub: { fontSize: typography.sizes.xs, color: colors.textSecondary },
  dashBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start' },
  dashBtnText: { color: colors.textWhite, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  sectionTitle: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold, color: colors.navyText, paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  taskCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: spacing.base, marginBottom: spacing.sm, borderRadius: radius.md, padding: spacing.base, ...shadows.card },
  taskLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, color: colors.navyText },
  taskMeta: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EBF5FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  mapText: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.semibold },
});
