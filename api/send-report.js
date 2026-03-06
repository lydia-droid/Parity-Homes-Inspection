const { Resend } = require('resend');

const resend = new Resend('re_WtsSJqyr_9bqC4GBzStQ9zCcPVMUR6N5e');
const RECIPIENTS = ['lydia@slemish.ca'];

function v(x) { return x || '—'; }
function arr(x) { return Array.isArray(x) && x.length ? x.join(', ') : '—'; }

function row(label, value) {
  return `
    <tr>
      <td style="padding:8px 12px;font-size:13px;color:#6b7280;width:40%;vertical-align:top;border-bottom:1px solid #f3f4f6">${label}</td>
      <td style="padding:8px 12px;font-size:13px;color:#111827;vertical-align:top;border-bottom:1px solid #f3f4f6">${value}</td>
    </tr>`;
}

function section(title, content) {
  return `
    <div style="margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#1a4fa0;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #eff6ff">${title}</div>
      <table style="width:100%;border-collapse:collapse">${content}</table>
    </div>`;
}

function buildActionItems(insp) {
  const items = [];
  if (['B - Minimal','C - Moderate','D - Significant'].includes(insp.historicalFabric))
    items.push({ text: 'Schedule CHAP stabilization', urgent: false });
  if (insp.frontPadlock === 'No')
    items.push({ text: 'Add padlock — front door', urgent: true });
  if (insp.rearPadlock === 'No')
    items.push({ text: 'Add padlock — rear door', urgent: true });
  const unsecWin = [];
  if (insp.frontWindowsCondition === 'Unsecured') unsecWin.push('front');
  if (insp.rearWindowCondition === 'Unsecured') unsecWin.push('rear');
  if (unsecWin.length)
    items.push({ text: `Secure ${unsecWin.join(' and ')} windows`, urgent: true });
  if (insp.sewerLineLocation === 'Not present/unknown')
    items.push({ text: 'Apply for sewer vault install w/ DPW', urgent: false });
  if (insp.waterLineCitySide === 'Galvanized')
    items.push({ text: 'Replace city-side water line with copper', urgent: false });
  if (insp.waterLineHouseSide === 'Galvanized')
    items.push({ text: 'Replace house-side water line with copper', urgent: false });
  if (insp.waterMeterPresent === 'No')
    items.push({ text: 'Apply for water meter install w/ DPW', urgent: false });
  if (insp.hazardsPresent === 'Yes' && insp.hazardsToPedestrians)
    items.push({ text: `Hazards to pedestrians: ${insp.hazardsToPedestrians}`, urgent: true });
  if (Array.isArray(insp.squatterSigns) && insp.squatterSigns.length > 0)
    items.push({ text: 'Initiate eviction procedures', urgent: true });
  // Manual next-steps
  const manualKeys = [
    { key: 'structuralDamage', label: 'Structural Damage' },
    { key: 'facadeCondition', label: 'Facade Condition' },
    { key: 'corniceCondition', label: 'Cornice Condition' },
    { key: 'frontDoorCondition', label: 'Front Door Condition' },
    { key: 'doorSurroundCondition', label: 'Door Surround Condition' },
    { key: 'rearWallCondition', label: 'Rear Wall Condition' },
    { key: 'lpWallCondition', label: 'LP Wall Condition' },
    { key: 'rearDoorCondition', label: 'Rear Door Condition' },
    { key: 'roofCondition', label: 'Roof Condition' },
    { key: 'squatterSigns', label: 'Squatter Activity' },
  ];
  for (const { key, label } of manualKeys) {
    const ns = insp[key + 'NextSteps'];
    const urg = insp[key + 'Urgency'];
    if (ns) items.push({ text: `${label}: ${ns}`, urgent: urg === 'Urgent' });
  }
  return items.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
}

function buildEmailHTML(insp) {
  const date = insp.inspectionDate
    ? new Date(insp.inspectionDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '—';
  const submitted = insp.submittedAt
    ? new Date(insp.submittedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  const actionItems = buildActionItems(insp);
  const urgentItems = actionItems.filter(i => i.urgent);
  const normalItems = actionItems.filter(i => !i.urgent);

  const actionHTML = actionItems.length ? `
    <div style="margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#1a4fa0;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #eff6ff">Action Items (${actionItems.length})</div>
      ${urgentItems.map(i => `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 10px;background:#fef2f2;border-left:3px solid #dc2626;border-radius:0 6px 6px 0;margin-bottom:6px;font-size:13px">
          <span style="color:#dc2626;font-weight:700;white-space:nowrap">⚠ Urgent</span>
          <span style="color:#111827">${i.text}</span>
        </div>`).join('')}
      ${normalItems.map(i => `
        <div style="padding:8px 10px;background:#f9fafb;border-left:3px solid #d1d5db;border-radius:0 6px 6px 0;margin-bottom:6px;font-size:13px;color:#111827">${i.text}</div>`).join('')}
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:680px;margin:24px auto;background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

  <!-- Header -->
  <div style="background:#1a4fa0;padding:28px 32px">
    <div style="font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:6px">Parity Homes</div>
    <div style="font-size:24px;font-weight:800;color:white;letter-spacing:-0.3px">Property Onboarding Report</div>
    <div style="margin-top:12px;font-size:13px;color:rgba(255,255,255,0.85)">${v(insp.address)}${insp.neighborhood ? ' &bull; ' + insp.neighborhood : ''}</div>
  </div>

  <!-- Meta strip -->
  <div style="background:#eff6ff;padding:12px 32px;display:flex;gap:24px;font-size:12px;color:#1a4fa0;border-bottom:1px solid #dbeafe">
    <span>📅 ${date}</span>
    <span>👤 ${v(insp.inspectorName)}</span>
    <span>🕐 Submitted ${submitted}</span>
  </div>

  <!-- Body -->
  <div style="padding:28px 32px">

    ${actionHTML}

    ${section('Structure & Overview',
      row('Structural Damage', v(insp.structuralDamage)) +
      row('Historical Fabric', v(insp.historicalFabric)) +
      (insp.notes ? row('Notes', v(insp.notes)) : '')
    )}

    ${section('Facade',
      row('Facade Condition', v(insp.facadeCondition)) +
      row('Facade Material', v(insp.facadeMaterial)) +
      row('Cornice Condition', v(insp.corniceCondition))
    )}

    ${section('Front Entry',
      row('Front Door Condition', v(insp.frontDoorCondition)) +
      row('Front Door Material', v(insp.frontDoorMaterial)) +
      row('Front Padlock', v(insp.frontPadlock)) +
      row('Front Windows', v(insp.frontWindowsCondition)) +
      row('English Basement', v(insp.englishBasement))
    )}

    ${section('Rear',
      row('Rear Wall Condition', v(insp.rearWallCondition)) +
      row('Rear Door Condition', v(insp.rearDoorCondition)) +
      row('Rear Padlock', v(insp.rearPadlock)) +
      row('Rear Window Condition', v(insp.rearWindowCondition))
    )}

    ${section('Roof & Utilities',
      row('Roof Condition', v(insp.roofCondition)) +
      row('Electrical Line Location', v(insp.electricalLineLocation)) +
      row('Electrical Line Elevation', v(insp.electricalLineElevation)) +
      row('Sewer Line Location', v(insp.sewerLineLocation)) +
      row('Water Line — City Side', v(insp.waterLineCitySide)) +
      row('Water Line — House Side', v(insp.waterLineHouseSide)) +
      row('Water Meter Present', v(insp.waterMeterPresent))
    )}

    ${section('Site Conditions',
      row('Back Yard Condition', arr(insp.backYardCondition)) +
      row('Hazards to Pedestrians', v(insp.hazardsPresent) + (insp.hazardsPresent === 'Yes' && insp.hazardsToPedestrians ? ': ' + insp.hazardsToPedestrians : '')) +
      row('Squatter Signs', arr(insp.squatterSigns)) +
      (insp.squatterOther ? row('Squatter Notes', v(insp.squatterOther)) : '')
    )}

  </div>

  <!-- Footer -->
  <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">
    Generated by Parity Homes Property Onboarding App &bull; Record ID: ${v(insp.id)}
  </div>

</div>
</body>
</html>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const insp = req.body;
  if (!insp || !insp.address) {
    return res.status(400).json({ error: 'Invalid inspection data' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: RECIPIENTS,
      subject: `Property Onboarding Report — ${insp.address}${insp.inspectionDate ? ' (' + insp.inspectionDate + ')' : ''}`,
      html: buildEmailHTML(insp),
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true, id: data?.id });
  } catch (e) {
    console.error('Send error:', e);
    return res.status(500).json({ error: e.message });
  }
};
