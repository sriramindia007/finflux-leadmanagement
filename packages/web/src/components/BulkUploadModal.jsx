import React, { useState, useRef, useCallback } from 'react';
import { api } from '../services/api';

// ── helpers ─────────────────────────────────────────────────────
function countDataRows(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result.split('\n').filter(l => l.trim());
      resolve(Math.max(0, lines.length - 1)); // subtract header
    };
    reader.readAsText(file);
  });
}

// ── sub-components ───────────────────────────────────────────────
function SummaryCard({ icon, label, count, color }) {
  return (
    <div style={{ flex: 1, border: `1.5px solid ${color}22`, borderRadius: 8, padding: '12px 14px', background: `${color}0D`, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', textAlign: 'center' }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color }}>{count}</span>
      <span style={{ fontSize: 12, color: '#6B7280' }}>{label}</span>
    </div>
  );
}

// ── main component ───────────────────────────────────────────────
export default function BulkUploadModal({ onClose, onUploaded }) {
  const [file, setFile]           = useState(null);
  const [rowCount, setRowCount]   = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [stage, setStage]         = useState('idle'); // idle | uploading | done | error
  const [result, setResult]       = useState(null);
  const [apiError, setApiError]   = useState('');
  const [showAllErrors, setShowAllErrors] = useState(false);
  const fileInputRef              = useRef(null);

  // ── file selection ──────────────────────────────────────────────
  const handleFile = useCallback(async (f) => {
    if (!f || !f.name.endsWith('.csv')) {
      setApiError('Please select a .csv file.');
      return;
    }
    setFile(f);
    setApiError('');
    setResult(null);
    setStage('idle');
    const rows = await countDataRows(f);
    setRowCount(rows);
  }, []);

  const onInputChange = (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  };

  // ── drag-and-drop ───────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = ()  => setIsDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  // ── upload ──────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setStage('uploading');
    setApiError('');
    try {
      const res = await api.bulkUpload(file);
      setResult(res);
      setStage('done');
    } catch (err) {
      setApiError('Upload failed. Ensure the API server is running and the CSV format is correct.');
      setStage('error');
    }
  };

  // ── reset to pick another file ───────────────────────────────────
  const handleReset = () => {
    setFile(null);
    setRowCount(0);
    setResult(null);
    setStage('idle');
    setApiError('');
    setShowAllErrors(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── done: close and refresh ──────────────────────────────────────
  const handleDone = () => {
    onUploaded();
    onClose();
  };

  const visibleErrors = result?.errors
    ? (showAllErrors ? result.errors : result.errors.slice(0, 10))
    : [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={stage !== 'uploading' ? onClose : undefined}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }}
      />

      {/* Modal */}
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#003366' }}>Bulk Lead Upload</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Upload leads from a CSV file</div>
          </div>
          {stage !== 'uploading' && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', lineHeight: 1 }}>✕</button>
          )}
        </div>

        {/* Body */}
        <div style={s.body}>

          {/* Step 1: Download template */}
          <div style={s.templateRow}>
            <span style={{ fontSize: 13, color: '#374151' }}>Need the format?</span>
            <button onClick={() => api.downloadTemplate()} style={s.templateLink}>
              ⬇ Download CSV Template
            </button>
          </div>

          {/* Step 2: Drop zone */}
          {stage !== 'done' && (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                ...s.dropZone,
                borderColor: isDragging ? '#1874D0' : file ? '#10B981' : '#CFD6DD',
                background: isDragging ? '#EFF6FF' : file ? '#F0FDF4' : '#FAFAFA',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={onInputChange}
              />
              {file ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#003366' }}>{file.name}</div>
                  <div style={{ fontSize: 13, color: '#10B981', marginTop: 4 }}>
                    {rowCount} data {rowCount === 1 ? 'row' : 'rows'} detected
                  </div>
                  {stage === 'idle' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReset(); }}
                      style={{ marginTop: 8, fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Choose a different file
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>☁️</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Drag &amp; drop your CSV here</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>or click to browse</div>
                  <div style={{ fontSize: 12, color: '#D1D5DB', marginTop: 8 }}>Accepts .csv files up to 5 MB</div>
                </div>
              )}
            </div>
          )}

          {/* Uploading state */}
          {stage === 'uploading' && (
            <div style={s.uploadingBox}>
              <div style={s.spinner} />
              <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                Uploading {rowCount} rows...
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Please wait, do not close this window</div>
            </div>
          )}

          {/* Error banner */}
          {apiError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#B91C1C' }}>
              ⚠️ {apiError}
            </div>
          )}

          {/* Results */}
          {stage === 'done' && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary cards */}
              <div style={{ display: 'flex', gap: 12 }}>
                <SummaryCard icon="✅" label="Created"    count={result.created}    color="#10B981" />
                <SummaryCard icon="🔁" label="Duplicates" count={result.duplicates} color="#F59E0B" />
                <SummaryCard icon="❌" label="Failed"     count={result.failed}     color="#EF4444" />
              </div>

              {/* Success message */}
              {result.created > 0 && (
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#065F46', fontWeight: 500 }}>
                  ✓ {result.created} lead{result.created !== 1 ? 's' : ''} created successfully and added to the Approval Pending queue.
                </div>
              )}

              {/* Error table */}
              {result.errors && result.errors.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    Issues ({result.errors.length} rows)
                  </div>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#F9FAFB' }}>
                          <th style={s.errTh}>Row #</th>
                          <th style={s.errTh}>Mobile</th>
                          <th style={s.errTh}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleErrors.map((err, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                            <td style={s.errTd}>{err.row}</td>
                            <td style={s.errTd}>{err.mobile || '—'}</td>
                            <td style={{ ...s.errTd, color: err.reason.startsWith('Duplicate') ? '#D97706' : '#EF4444' }}>
                              {err.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.errors.length > 10 && (
                      <button
                        onClick={() => setShowAllErrors(v => !v)}
                        style={{ width: '100%', padding: '8px', border: 'none', background: '#F9FAFB', fontSize: 12, color: '#1874D0', cursor: 'pointer', borderTop: '1px solid #E5E7EB' }}
                      >
                        {showAllErrors ? '▲ Show fewer' : `▼ Show all ${result.errors.length} issues`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Upload another */}
              <button onClick={handleReset} style={{ background: 'none', border: 'none', fontSize: 13, color: '#1874D0', cursor: 'pointer', textAlign: 'left', padding: 0, textDecoration: 'underline' }}>
                Upload another file
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          {stage !== 'uploading' && stage !== 'done' && (
            <>
              <button onClick={onClose} style={s.cancelBtn}>Cancel</button>
              <button
                onClick={handleUpload}
                disabled={!file || rowCount === 0}
                style={{ ...s.uploadBtn, background: !file || rowCount === 0 ? '#9CA3AF' : '#1874D0', cursor: !file || rowCount === 0 ? 'not-allowed' : 'pointer' }}
              >
                ⬆ Upload {rowCount > 0 ? `${rowCount} Leads` : 'CSV'}
              </button>
            </>
          )}
          {stage === 'done' && (
            <button onClick={handleDone} style={{ ...s.uploadBtn, background: '#10B981' }}>
              Done — View Leads
            </button>
          )}
        </div>
      </div>
    </>
  );
}

const s = {
  modal: {
    position: 'fixed', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#fff', borderRadius: 12, width: 540,
    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
    zIndex: 201, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 24px', borderBottom: '1px solid #E5E7EB', flexShrink: 0,
  },
  body: {
    flex: 1, overflowY: 'auto', padding: '20px 24px',
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 12,
    padding: '16px 24px', borderTop: '1px solid #E5E7EB', flexShrink: 0,
  },
  templateRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px', background: '#EFF6FF', borderRadius: 8,
    border: '1px solid #BFDBFE',
  },
  templateLink: {
    background: 'none', border: '1px solid #1874D0', borderRadius: 4,
    padding: '4px 12px', fontSize: 13, color: '#1874D0',
    cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
  },
  dropZone: {
    border: '2px dashed', borderRadius: 10, padding: '32px 20px',
    cursor: 'pointer', transition: 'all 0.15s ease',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 140,
  },
  uploadingBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 12, padding: '32px 20px',
  },
  spinner: {
    width: 36, height: 36,
    border: '3px solid #E5E7EB',
    borderTop: '3px solid #1874D0',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  cancelBtn: {
    padding: '8px 20px', border: '1px solid #CFD6DD',
    borderRadius: 4, background: '#fff', cursor: 'pointer',
    fontSize: 14, color: '#374151',
  },
  uploadBtn: {
    padding: '8px 24px', border: 'none', borderRadius: 4,
    color: '#fff', fontSize: 14, fontWeight: 600,
  },
  errTh: {
    padding: '8px 12px', textAlign: 'left', fontSize: 11,
    fontWeight: 700, color: '#5F6368', textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  errTd: {
    padding: '7px 12px', color: '#374151',
  },
};
