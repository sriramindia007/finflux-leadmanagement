import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, radius } from '../theme';

const CONFIG = {
  APPROVAL_PENDING: { label: 'APPROVAL PENDING', color: colors.pending, bg: colors.pendingBg },
  QUALIFIED:        { label: 'QUALIFIED',         color: colors.qualified, bg: colors.qualifiedBg },
  APPROVED:         { label: 'APPROVED',           color: colors.approved, bg: colors.approvedBg },
  CONVERTED:        { label: 'CONVERTED',          color: colors.converted, bg: colors.convertedBg },
  REJECTED:         { label: 'REJECTED',           color: colors.rejected, bg: colors.rejectedBg },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || CONFIG.APPROVAL_PENDING;
  return (
    <View style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
      <Text style={[s.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
  },
});
