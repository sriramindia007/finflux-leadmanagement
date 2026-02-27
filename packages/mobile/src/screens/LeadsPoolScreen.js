import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { api } from '../services/api';
import LeadCard from '../components/LeadCard';

const FILTERS = ['ALL', 'APPROVAL_PENDING', 'QUALIFIED', 'REJECTED', 'CONVERTED'];
const FILTER_LABELS = { ALL: 'All', APPROVAL_PENDING: 'Pending', QUALIFIED: 'Qualified', REJECTED: 'Rejected', CONVERTED: 'Converted' };

export default function LeadsPoolScreen({ navigation }) {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      const data = await api.getLeads(params);
      setLeads(data.data);
    } catch (_) {}
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [filter]);

  // Refresh when screen is focused (after new lead created)
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.navyText} />
        </TouchableOpacity>
        <Text style={s.title}>Leads Pool</Text>
      </View>

      {/* Filter Tabs */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{FILTER_LABELS[f]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lead List */}
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <LeadCard lead={item} onPress={lead => navigation.navigate('OnboardingJourney', { lead })} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={s.list}
          ListEmptyComponent={<View style={s.center}><Text style={s.emptyText}>No leads found</Text></View>}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('NewLead')} activeOpacity={0.85}>
        <Ionicons name="person-add" size={24} color={colors.textWhite} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, paddingHorizontal: spacing.base, paddingBottom: spacing.sm, gap: spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.navyText },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterBtnActive: { backgroundColor: colors.navyText, borderColor: colors.navyText },
  filterText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textSecondary },
  filterTextActive: { color: colors.textWhite, fontWeight: typography.weights.semibold },
  list: { paddingTop: spacing.sm, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: colors.textSecondary, fontSize: typography.sizes.base },
  fab: { position: 'absolute', bottom: 84, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.fab },
});
