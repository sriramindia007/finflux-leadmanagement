import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

function StepIcon({ status }) {
  if (status === 'completed') return <Ionicons name="checkmark-circle" size={24} color={colors.stepDone} />;
  if (status === 'in_progress') return <Ionicons name="time" size={24} color={colors.stepActive} />;
  return <Ionicons name="time-outline" size={24} color={colors.stepPending} />;
}

function StepRow({ step, onPress }) {
  const isActive  = step.status === 'in_progress';
  const isDone    = step.status === 'completed';
  const isPending = step.status === 'pending';

  return (
    <TouchableOpacity
      style={[s.stepCard, isPending && s.stepCardPending]}
      onPress={() => !isPending && onPress(step)}
      activeOpacity={isPending ? 1 : 0.8}
    >
      <StepIcon status={step.status} />
      <View style={s.stepInfo}>
        <Text style={[s.stepName, isActive && s.stepNameActive, isDone && s.stepNameDone, isPending && s.stepNamePending]}>
          {step.name}
        </Text>
        {(isActive || isDone) && step.completedBy && (
          <Text style={s.stepMeta}>
            {isDone
              ? `${step.completedAt ? new Date(step.completedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''} • by ${step.completedBy}`
              : `Due in 1h • by ${step.completedBy || 'Manoj'}`}
          </Text>
        )}
        {isActive && !step.completedBy && <Text style={s.stepMeta}>Due in 1h</Text>}
      </View>
      {!isPending && <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
    </TouchableOpacity>
  );
}

// ── Convert confirmation sheet ───────────────────────────────────
function ConvertConfirmSheet({ lead, onConfirm, onCancel, converting }) {
  return (
    <View style={s.convertSheet}>
      <View style={s.convertSheetHandle} />
      <Text style={s.convertSheetTitle}>Convert to Loan Application?</Text>
      <Text style={s.convertSheetSub}>All onboarding steps are complete. Please review the lead details below.</Text>

      {[
        ['Customer',    lead.name],
        ['Mobile',      lead.mobile],
        ['Lead Type',   lead.leadType],
        ['Loan Amount', lead.loanAmount ? `₹ ${Number(lead.loanAmount).toLocaleString('en-IN')}` : '—'],
        ['Purpose',     lead.loanPurpose || '—'],
      ].map(([k, v]) => (
        <View key={k} style={s.convertRow}>
          <Text style={s.convertLabel}>{k}</Text>
          <Text style={s.convertValue}>{v}</Text>
        </View>
      ))}

      <View style={s.convertNote}>
        <Text style={s.convertNoteText}>This will create a Loan Application and mark the lead as CONVERTED.</Text>
      </View>

      <TouchableOpacity
        style={[s.convertBtn, converting && { opacity: 0.6 }]}
        onPress={onConfirm}
        disabled={converting}
        activeOpacity={0.85}
      >
        <Text style={s.convertBtnText}>{converting ? 'Converting...' : 'Confirm & Convert'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.cancelBtn} onPress={onCancel} disabled={converting}>
        <Text style={s.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OnboardingJourneyScreen({ navigation, route }) {
  const [lead, setLead]             = useState(route.params.lead);
  const [showConvert, setShowConvert] = useState(false);
  const [converting, setConverting]   = useState(false);

  useEffect(() => {
    const refresh = async () => {
      try { const updated = await api.getLead(lead.id); setLead(updated); } catch (_) {}
    };
    const unsub = navigation.addListener('focus', refresh);
    return unsub;
  }, [navigation, lead.id]);

  const handleCall = () => {
    if (lead.mobile) Linking.openURL(`tel:${lead.mobile}`);
  };

  const handleReject = () => navigation.navigate('Rejection', { lead });

  const handleStepPress = (step) => {
    Alert.alert(step.name, `Mark "${step.name}" as complete?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete', onPress: async () => {
          try {
            await api.updateStep(lead.id, step.id, { status: 'completed', completedAt: new Date().toISOString(), completedBy: 'Field Officer' });
            const updated = await api.getLead(lead.id);
            setLead(updated);
          } catch (_) { Alert.alert('Error', 'Failed to update step'); }
        },
      },
    ]);
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      await api.updateLead(lead.id, { status: 'CONVERTED', convertedAt: new Date().toISOString() });
      const updated = await api.getLead(lead.id);
      setLead(updated);
      setShowConvert(false);
      Alert.alert('Converted!', `${lead.name}'s lead has been converted to a Loan Application.`);
    } catch (_) {
      Alert.alert('Error', 'Failed to convert lead. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  const allStepsDone = lead.steps?.every(s => s.status === 'completed');
  const canConvert   = lead.status === 'QUALIFIED' && allStepsDone;

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.navyText} />
        </TouchableOpacity>
        <Text style={s.title}>Lead Onboarding</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Lead Info Card */}
        <View style={s.leadCard}>
          <View style={s.leadInfo}>
            <Text style={s.leadName}>{lead.name}</Text>
            <Text style={s.leadId}>ID: {lead.id}</Text>
            <StatusBadge status={lead.status} />
          </View>
          <TouchableOpacity style={s.callBtn} onPress={handleCall}>
            <Ionicons name="call" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Steps */}
        <Text style={s.sectionTitle}>Steps</Text>
        {lead.steps.map(step => (
          <StepRow key={step.id} step={step} onPress={handleStepPress} />
        ))}

        {/* Convert to Loan Application banner */}
        {canConvert && !showConvert && (
          <TouchableOpacity style={s.convertBanner} onPress={() => setShowConvert(true)} activeOpacity={0.85}>
            <View style={{ flex: 1 }}>
              <Text style={s.convertBannerTitle}>All steps complete!</Text>
              <Text style={s.convertBannerSub}>Tap to convert to Loan Application</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="#10B981" />
          </TouchableOpacity>
        )}

        {/* Inline convert confirmation sheet */}
        {canConvert && showConvert && (
          <ConvertConfirmSheet
            lead={lead}
            onConfirm={handleConvert}
            onCancel={() => setShowConvert(false)}
            converting={converting}
          />
        )}

        {/* Reject Button */}
        {lead.status !== 'REJECTED' && lead.status !== 'CONVERTED' && (
          <TouchableOpacity style={s.rejectBtn} onPress={handleReject}>
            <Text style={s.rejectBtnText}>Reject Lead</Text>
          </TouchableOpacity>
        )}

        {/* Converted state */}
        {lead.status === 'CONVERTED' && (
          <View style={s.convertedCard}>
            <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            <View style={{ marginLeft: 12 }}>
              <Text style={s.convertedTitle}>Lead Converted</Text>
              <Text style={s.convertedSub}>Loan Application has been created</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, paddingHorizontal: spacing.base, paddingBottom: spacing.sm, gap: spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.navyText },
  scroll: { paddingHorizontal: spacing.base, paddingBottom: 40 },
  leadCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.base, ...shadows.card },
  leadInfo: { flex: 1, gap: 4 },
  leadName: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.navyText },
  leadId: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  callBtn: { padding: 8, backgroundColor: '#EBF5FF', borderRadius: radius.full },
  sectionTitle: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold, color: colors.navyText, marginBottom: spacing.sm },
  stepCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.borderLight, ...shadows.card },
  stepCardPending: { opacity: 0.6 },
  stepInfo: { flex: 1 },
  stepName: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, color: colors.navyText },
  stepNameActive: { color: colors.stepActive },
  stepNameDone: { color: colors.stepDone },
  stepNamePending: { color: colors.textMuted },
  stepMeta: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },

  // Convert banner
  convertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: radius.lg, borderWidth: 1.5, borderColor: '#86EFAC', padding: spacing.base, marginBottom: spacing.sm },
  convertBannerTitle: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold, color: '#065F46' },
  convertBannerSub: { fontSize: typography.sizes.sm, color: '#047857', marginTop: 2 },

  // Convert sheet
  convertSheet: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.sm, borderWidth: 1.5, borderColor: '#86EFAC', ...shadows.card },
  convertSheetHandle: { width: 40, height: 4, backgroundColor: '#D1FAE5', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  convertSheetTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: '#065F46', marginBottom: 4 },
  convertSheetSub: { fontSize: typography.sizes.sm, color: '#047857', marginBottom: 14 },
  convertRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  convertLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  convertValue: { fontSize: 13, color: colors.navyText, fontWeight: '600' },
  convertNote: { backgroundColor: '#F0FDF4', borderRadius: 8, padding: 10, marginVertical: 12 },
  convertNoteText: { fontSize: 12, color: '#047857' },
  convertBtn: { backgroundColor: '#10B981', borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  convertBtnText: { color: '#fff', fontSize: typography.sizes.base, fontWeight: typography.weights.bold },
  cancelBtn: { borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { fontSize: typography.sizes.base, color: colors.textSecondary },

  // Converted state
  convertedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', borderRadius: radius.lg, padding: spacing.base, marginTop: spacing.sm },
  convertedTitle: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold, color: '#065F46' },
  convertedSub: { fontSize: typography.sizes.sm, color: '#047857', marginTop: 2 },

  rejectBtn: { marginTop: spacing.lg, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.rejected, paddingVertical: 14, alignItems: 'center' },
  rejectBtnText: { color: colors.rejected, fontWeight: typography.weights.semibold, fontSize: typography.sizes.base },
});
