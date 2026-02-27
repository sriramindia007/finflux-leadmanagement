import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { api } from '../services/api';

const REJECTION_REASONS = ['Low Credit Score', 'Insufficient Income', 'Already Has Loan', 'Invalid Documents', 'Ineligible Area', 'Customer Declined', 'Other'];

export default function RejectionScreen({ navigation, route }) {
  const { lead } = route.params;
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!reason) { Alert.alert('Select a reason', 'Please select a rejection reason.'); return; }
    setSaving(true);
    try {
      await api.updateLead(lead.id, { status: 'REJECTED', rejectionReason: reason });
      Alert.alert('Lead Rejected', `${lead.name}'s lead has been rejected.`, [
        { text: 'OK', onPress: () => navigation.popToTop() }
      ]);
    } catch (_) {
      Alert.alert('Error', 'Failed to reject lead. Make sure the API server is running.');
    } finally { setSaving(false); }
  };

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.navyText} />
        </TouchableOpacity>
        <Text style={s.title}>Rejection Reasons</Text>
      </View>

      <View style={s.body}>
        <Text style={s.warning}>Are you sure to reject this lead?</Text>
        <Text style={s.warningNote}>This action cannot be undone.</Text>

        {/* Reason Dropdown */}
        <View style={{ zIndex: 10 }}>
          <TouchableOpacity style={s.dropdown} onPress={() => setOpen(!open)}>
            <Text style={reason ? s.dropdownValue : s.dropdownPlaceholder}>{reason || 'Rejection reason'}</Text>
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.navyText} />
          </TouchableOpacity>
          {open && (
            <View style={s.options}>
              {REJECTION_REASONS.map(r => (
                <TouchableOpacity key={r} style={s.option} onPress={() => { setReason(r); setOpen(false); }}>
                  <Text style={[s.optText, reason === r && s.optSelected]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Footer Buttons */}
      <View style={s.footer}>
        <TouchableOpacity style={[s.confirmBtn, !reason && s.confirmBtnDisabled]} onPress={handleConfirm} disabled={!reason || saving}>
          {saving ? <ActivityIndicator color={colors.textSecondary} /> : <Text style={s.confirmText}>Confirm</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={s.goBackBtn} onPress={() => navigation.goBack()}>
          <Text style={s.goBackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, paddingHorizontal: spacing.base, paddingBottom: spacing.sm, gap: spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.navyText },
  body: { flex: 1, paddingHorizontal: spacing.base, paddingTop: spacing.base },
  warning: { fontSize: typography.sizes.base, color: colors.navyText, fontWeight: typography.weights.medium, marginBottom: 4 },
  warningNote: { fontSize: typography.sizes.base, color: colors.navyText, marginBottom: spacing.lg },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.base, minHeight: 52 },
  dropdownPlaceholder: { fontSize: typography.sizes.base, color: colors.textMuted },
  dropdownValue: { fontSize: typography.sizes.base, color: colors.navyText },
  options: { position: 'absolute', top: 54, left: 0, right: 0, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, zIndex: 100, ...shadows.card },
  option: { paddingHorizontal: spacing.base, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  optText: { fontSize: typography.sizes.base, color: colors.navyText },
  optSelected: { color: colors.primary, fontWeight: typography.weights.semibold },
  footer: { padding: spacing.base, gap: spacing.sm },
  confirmBtn: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.surface },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmText: { color: colors.textSecondary, fontSize: typography.sizes.base, fontWeight: typography.weights.semibold },
  goBackBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center' },
  goBackText: { color: colors.textWhite, fontSize: typography.sizes.base, fontWeight: typography.weights.bold },
});
