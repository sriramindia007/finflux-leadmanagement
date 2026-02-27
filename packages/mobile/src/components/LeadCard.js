import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme';
import StatusBadge from './StatusBadge';

export default function LeadCard({ lead, onPress }) {
  return (
    <TouchableOpacity style={s.card} onPress={() => onPress(lead)} activeOpacity={0.8}>
      <View style={s.row}>
        <View style={s.info}>
          <Text style={s.name}>{lead.name}</Text>
          <Text style={s.type}>{lead.leadType} Lead</Text>
          {lead.locality ? (
            <Text style={s.area}>Area: {lead.locality}</Text>
          ) : null}
          {lead.assignedTo && lead.status === 'APPROVED' ? (
            <Text style={s.assigned}>Assigned to you by BM</Text>
          ) : null}
          <View style={s.badgeRow}>
            <StatusBadge status={lead.status} />
            {lead.status === 'CONVERTED' ? (
              <View style={s.points}>
                <Text style={s.pointsText}>+800</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1 },
  name: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.navyText, marginBottom: 2 },
  type: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: 4 },
  area: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: 4 },
  assigned: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  points: { flexDirection: 'row', alignItems: 'center' },
  pointsText: { color: colors.converted, fontWeight: typography.weights.bold, fontSize: typography.sizes.md },
});
