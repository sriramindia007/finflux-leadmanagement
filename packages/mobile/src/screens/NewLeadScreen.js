import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { api } from '../services/api';

const LEAD_TYPES = ['Individual', 'Group'];
const SOURCES    = ['Field Scouting', 'Inbound Call', 'Outbound Call', 'Referral'];
const PURPOSES   = ['Business', 'Working Capital', 'Business Expansion', 'Asset Purchase'];

function Field({ label, required, error, children }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>
        {label}{required && <Text style={{ color: colors.rejected }}> *</Text>}
      </Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function NewLeadScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '', mobile: '', leadType: '', leadSource: '',
    loanAmount: '', loanPurpose: '', notes: '',
  });
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [dedup, setDedup]       = useState({ status: 'idle', lead: null }); // idle|checking|found|clear
  const [proceedReason, setProceedReason]         = useState('');
  const [proceedingAnyway, setProceedingAnyway]   = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const clearError = (k) => setErrors(e => ({ ...e, [k]: '' }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || !/^[A-Za-z\s]{2,}$/.test(form.name.trim())) errs.name = 'Enter a valid name';
    if (!/^[6-9]\d{9}$/.test(form.mobile)) errs.mobile = 'Enter a valid 10-digit number';
    if (!form.leadType) errs.leadType = 'Select a lead type';
    if (!form.loanAmount || isNaN(Number(form.loanAmount)) || Number(form.loanAmount) <= 0) errs.loanAmount = 'Enter a valid amount';
    return errs;
  };

  const checkDedup = async (mobile) => {
    if (!/^[6-9]\d{9}$/.test(mobile)) return;
    setDedup({ status: 'checking', lead: null });
    try {
      const res = await api.getLeads({ search: mobile });
      const exact = (res.data || []).find(l => l.mobile === mobile);
      if (exact) setDedup({ status: 'found', lead: exact });
      else       setDedup({ status: 'clear', lead: null });
    } catch (_) {
      setDedup({ status: 'idle', lead: null });
    }
  };

  const handleSave = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (dedup.status === 'found' && !proceedingAnyway) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        loanAmount: Number(form.loanAmount),
        createdBy: 'Field Officer',
        createdByRole: 'Field Officer',
        source: form.leadSource,
      };
      if (proceedingAnyway && proceedReason) payload.dedupOverrideReason = proceedReason;
      await api.createLead(payload);
      navigation.goBack();
    } catch (_) {
      setErrors(e => ({ ...e, submit: 'Failed to create lead. Is the API running?' }));
    } finally {
      setSaving(false);
    }
  };

  const isSaveBlocked = dedup.status === 'found' && !proceedingAnyway;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Lead</Text>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.base, paddingBottom: 100 }}>
        <Text style={styles.section}>Basic Info</Text>

        {/* Name */}
        <Field label="Name" required error={errors.name}>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Customer full name"
            placeholderTextColor={colors.textMuted}
            value={form.name}
            onChangeText={v => { set('name', v); clearError('name'); }}
          />
        </Field>

        {/* Mobile with dedup */}
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.label}>Mobile Number <Text style={{ color: colors.rejected }}>*</Text></Text>
          <TextInput
            style={[styles.input, errors.mobile && styles.inputError]}
            placeholder="10-digit number"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
            value={form.mobile}
            onChangeText={v => {
              const clean = v.replace(/\D/g, '').slice(0, 10);
              set('mobile', clean);
              clearError('mobile');
              if (clean.length < 10) setDedup({ status: 'idle', lead: null });
            }}
            onBlur={() => checkDedup(form.mobile)}
          />
          {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}
          {dedup.status === 'checking' && <Text style={styles.dedupChecking}>Checking duplicates...</Text>}
          {dedup.status === 'clear'    && <Text style={styles.dedupClear}>✓ No duplicate found</Text>}
          {dedup.status === 'found' && !proceedingAnyway && (
            <View style={styles.dedupWarning}>
              <Text style={styles.dedupWarnTitle}>⚠️ Existing lead found</Text>
              <Text style={styles.dedupWarnText}>{dedup.lead.name}  •  {dedup.lead.status}</Text>
              <TouchableOpacity onPress={() => setProceedingAnyway(true)} style={styles.proceedBtn}>
                <Text style={styles.proceedBtnText}>Proceed Anyway</Text>
              </TouchableOpacity>
            </View>
          )}
          {dedup.status === 'found' && proceedingAnyway && (
            <TextInput
              style={[styles.input, { borderColor: '#F59E0B', marginTop: 6, fontSize: 12 }]}
              placeholder="Reason for proceeding with duplicate..."
              placeholderTextColor={colors.textMuted}
              value={proceedReason}
              onChangeText={setProceedReason}
            />
          )}
        </View>

        {/* Lead Type */}
        <Field label="Lead Type" required error={errors.leadType}>
          <View style={styles.chipRow}>
            {LEAD_TYPES.map(t => (
              <TouchableOpacity key={t} onPress={() => { set('leadType', t); clearError('leadType'); }}
                style={[styles.chip, form.leadType === t && styles.chipActive]}>
                <Text style={[styles.chipText, form.leadType === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {/* Lead Source */}
        <Field label="Lead Source">
          <View style={styles.chipRow}>
            {SOURCES.map(s => (
              <TouchableOpacity key={s} onPress={() => set('leadSource', s)}
                style={[styles.chip, form.leadSource === s && styles.chipActive]}>
                <Text style={[styles.chipText, form.leadSource === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {/* Loan Amount */}
        <Field label="Loan Amount (₹)" required error={errors.loanAmount}>
          <TextInput
            style={[styles.input, errors.loanAmount && styles.inputError]}
            placeholder="e.g. 25000"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={form.loanAmount}
            onChangeText={v => { set('loanAmount', v.replace(/\D/g, '')); clearError('loanAmount'); }}
          />
        </Field>

        {/* Loan Purpose */}
        <Field label="Loan Purpose">
          <View style={styles.chipRow}>
            {PURPOSES.map(p => (
              <TouchableOpacity key={p} onPress={() => set('loanPurpose', p)}
                style={[styles.chip, form.loanPurpose === p && styles.chipActive]}>
                <Text style={[styles.chipText, form.loanPurpose === p && styles.chipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {/* Notes */}
        <Field label="Notes">
          <TextInput
            style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]}
            placeholder="Optional notes"
            placeholderTextColor={colors.textMuted}
            multiline
            value={form.notes}
            onChangeText={v => set('notes', v)}
          />
        </Field>

        {errors.submit ? <Text style={[styles.errorText, { textAlign: 'center', marginTop: 4 }]}>{errors.submit}</Text> : null}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, (saving || isSaveBlocked) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving || isSaveBlocked}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.saveBtnText}>{isSaveBlocked ? 'Resolve Duplicate First' : 'Save Lead'}</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:         { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.base, paddingTop: spacing.lg, backgroundColor: colors.background },
  backBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  backText:       { fontSize: 18, color: colors.navyText },
  title:          { fontSize: 18, fontWeight: '700', color: colors.navyText },
  scroll:         { flex: 1 },
  section:        { fontSize: 13, fontWeight: '700', color: colors.navyText, marginBottom: 12 },
  label:          { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input:          { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.sm, fontSize: 14, color: colors.navyText },
  inputError:     { borderColor: colors.rejected },
  errorText:      { fontSize: 11, color: colors.rejected, marginTop: 2 },
  dedupChecking:  { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  dedupClear:     { fontSize: 11, color: colors.converted, fontWeight: '500', marginTop: 4 },
  dedupWarning:   { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B', borderRadius: 6, padding: 10, marginTop: 6 },
  dedupWarnTitle: { fontSize: 12, fontWeight: '600', color: '#92400E', marginBottom: 4 },
  dedupWarnText:  { fontSize: 12, color: '#78350F' },
  proceedBtn:     { marginTop: 8, borderWidth: 1, borderColor: '#F59E0B', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  proceedBtnText: { fontSize: 12, color: '#92400E' },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive:     { borderColor: colors.primary, backgroundColor: '#EBF5FF' },
  chipText:       { fontSize: 12, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  footer:         { padding: spacing.base, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight },
  saveBtn:        { backgroundColor: colors.primary, borderRadius: radius.pill, padding: spacing.md, alignItems: 'center' },
  saveBtnDisabled:{ backgroundColor: colors.textMuted },
  saveBtnText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
});
