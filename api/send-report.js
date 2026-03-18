const { Resend } = require('resend');
const PDFDocument = require('pdfkit');

const resend = new Resend('re_WtsSJqyr_9bqC4GBzStQ9zCcPVMUR6N5e');
const RECIPIENTS = [
  'lydia@parityhomes.com',
  'operations@parityhomes.com',
  'bree@parityhomes.com',
  'coleen@parityhomes.com',
];

function v(x) { return x || '—'; }
function arr(x) { return Array.isArray(x) && x.length ? x.join(', ') : '—'; }

// ─── PDF GENERATION ──────────────────────────────────────────────────────────

function generatePDF(insp) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 45, size: 'A4' });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const BLUE = '#1a4fa0';
      const LIGHT_BLUE = '#eff6ff';
      const GRAY = '#6b7280';
      const DARK = '#111827';
      const RED = '#dc2626';
      const pageW = doc.page.width - 90; // usable width

      const date = insp.inspectionDate
        ? new Date(insp.inspectionDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : '—';
      const submitted = insp.submittedAt
        ? new Date(insp.submittedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
        : '—';

      // ── Header ──
      doc.rect(0, 0, doc.page.width, 90).fill(BLUE);
      doc.fillColor('white')
        .fontSize(9).font('Helvetica').text('PARITY HOMES', 45, 22, { characterSpacing: 2 });
      doc.fontSize(20).font('Helvetica-Bold').text('Property Onboarding Report', 45, 36);
      doc.fontSize(11).font('Helvetica')
        .text(`${v(insp.address)}${insp.neighborhood ? '  ·  ' + insp.neighborhood : ''}`, 45, 64);

      // ── Meta strip ──
      doc.rect(0, 90, doc.page.width, 28).fill(LIGHT_BLUE);
      doc.fillColor(BLUE).fontSize(9).font('Helvetica')
        .text(`Date: ${date}     Inspector: ${v(insp.inspectorName)}     Submitted: ${submitted}`, 45, 100);

      doc.moveDown(2);
      let y = 130;

      // Helper: section header
      const sectionHeader = (title) => {
        doc.moveTo(45, y).lineTo(45 + pageW, y).strokeColor(LIGHT_BLUE).lineWidth(1).stroke();
        doc.fillColor(BLUE).fontSize(8).font('Helvetica-Bold')
          .text(title.toUpperCase(), 45, y + 4, { characterSpacing: 1 });
        y += 20;
        doc.moveTo(45, y).lineTo(45 + pageW, y).strokeColor('#dbeafe').lineWidth(0.5).stroke();
        y += 6;
      };

      // Helper: data row
      const dataRow = (label, value) => {
        if (y > doc.page.height - 80) { doc.addPage(); y = 45; }
        doc.fillColor(GRAY).fontSize(9).font('Helvetica').text(label, 45, y, { width: 180 });
        doc.fillColor(DARK).fontSize(9).font('Helvetica').text(value, 230, y, { width: pageW - 185 });
        y += Math.max(
          doc.heightOfString(label, { width: 180 }),
          doc.heightOfString(value, { width: pageW - 185 })
        ) + 5;
        doc.moveTo(45, y).lineTo(45 + pageW, y).strokeColor('#f3f4f6').lineWidth(0.5).stroke();
        y += 4;
      };

      // ── Action Items ──
      const actionItems = buildActionItems(insp);
      if (actionItems.length) {
        sectionHeader(`Action Items (${actionItems.length})`);
        for (const item of actionItems) {
          if (y > doc.page.height - 80) { doc.addPage(); y = 45; }
          const color = item.urgent ? RED : GRAY;
          const prefix = item.urgent ? '⚠ URGENT  ' : '·  ';
          doc.fillColor(color).fontSize(9).font(item.urgent ? 'Helvetica-Bold' : 'Helvetica')
            .text(prefix + item.text, 50, y, { width: pageW - 10 });
          y += doc.heightOfString(prefix + item.text, { width: pageW - 10 }) + 6;
        }
        y += 8;
      }

      // ── Structure & Overview ──
      sectionHeader('Structure & Overview');
      dataRow('Structural Damage', v(insp.structuralDamage));
      if (insp.structuralDamageNextSteps) dataRow('  Next Steps', v(insp.structuralDamageNextSteps));
      dataRow('Historical Fabric', v(insp.historicalFabric));
      dataRow('Elevation — 1st Floor', v(insp.elevationHeight1stFloor));
      dataRow('Elevation — 2nd Floor', v(insp.elevationHeight2ndFloor));
      dataRow('Elevation — 3rd Floor', v(insp.elevationHeight3rdFloor));
      if (insp.notes) dataRow('Notes', v(insp.notes));
      y += 8;

      // ── Facade ──
      sectionHeader('Facade');
      dataRow('Facade Condition', v(insp.facadeCondition));
      if (insp.facadeConditionNextSteps) dataRow('  Next Steps', v(insp.facadeConditionNextSteps));
      dataRow('Facade Material', v(insp.facadeMaterial));
      dataRow('Cornice Condition', v(insp.corniceCondition));
      if (insp.corniceConditionNextSteps) dataRow('  Next Steps', v(insp.corniceConditionNextSteps));
      dataRow('Cornice Material', v(insp.corniceMaterial));
      y += 8;

      // ── Front Entry ──
      sectionHeader('Front Entry');
      dataRow('Front Door Condition', v(insp.frontDoorCondition));
      if (insp.frontDoorConditionNextSteps) dataRow('  Next Steps', v(insp.frontDoorConditionNextSteps));
      dataRow('Front Door Material', v(insp.frontDoorMaterial));
      dataRow('Door Surround Condition', v(insp.doorSurroundCondition));
      dataRow('Door Surround Material', v(insp.doorSurroundMaterial));
      dataRow('Front Padlock', v(insp.frontPadlock));
      dataRow('Front Windows', v(insp.frontWindowsCondition));
      dataRow('English Basement', v(insp.englishBasement));
      y += 8;

      // ── Rear ──
      sectionHeader('Rear');
      dataRow('Rear Wall Condition', v(insp.rearWallCondition));
      if (insp.rearWallConditionNextSteps) dataRow('  Next Steps', v(insp.rearWallConditionNextSteps));
      dataRow('Rear Wall Config', v(insp.rearWallConfig));
      dataRow('LP Wall Condition', v(insp.lpWallCondition));
      dataRow('LP Wall Material', arr(insp.lpWallMaterial));
      dataRow('Rear Door Condition', v(insp.rearDoorCondition));
      dataRow('Rear Door Material', v(insp.rearDoorMaterial));
      dataRow('Rear Padlock', v(insp.rearPadlock));
      dataRow('Rear Window Condition', v(insp.rearWindowCondition));
      y += 8;

      // ── Roof & Utilities ──
      sectionHeader('Roof & Utilities');
      dataRow('Roof Condition', v(insp.roofCondition));
      if (insp.roofConditionNextSteps) dataRow('  Next Steps', v(insp.roofConditionNextSteps));
      dataRow('Roof Style', v(insp.roofStyle));
      dataRow('Electrical Line Location', v(insp.electricalLineLocation));
      dataRow('Electrical Line Elevation', v(insp.electricalLineElevation));
      dataRow('Gas Line Location', v(insp.gasLineLocation));
      dataRow('Sewer Line Location', v(insp.sewerLineLocation));
      dataRow('Water Line — City Side', v(insp.waterLineCitySide));
      dataRow('Water Line — House Side', v(insp.waterLineHouseSide));
      dataRow('Water Meter Present', v(insp.waterMeterPresent));
      y += 8;

      // ── Site Conditions ──
      sectionHeader('Site Conditions');
      dataRow('Back Yard Condition', arr(insp.backYardCondition));
      dataRow('Hazards to Pedestrians', v(insp.hazardsPresent) + (insp.hazardsPresent === 'Yes' && insp.hazardsToPedestrians ? ': ' + insp.hazardsToPedestrians : ''));
      dataRow('Squatter Signs', arr(insp.squatterSigns));
      if (insp.squatterOther) dataRow('Squatter Notes', v(insp.squatterOther));
      y += 8;

      // ── Photo URLs ──
      const photoUrls = Object.values(insp.photos || {}).flat()
        .filter(src => src && src.startsWith('https://'));
      if (photoUrls.length) {
        sectionHeader('Photos');
        doc.fillColor(GRAY).fontSize(8).font('Helvetica')
          .text(`${photoUrls.length} photo(s) attached to this inspection. View full-size photos in the email body or at the links below.`, 45, y, { width: pageW });
        y += 24;
        photoUrls.forEach((url, i) => {
          if (y > doc.page.height - 60) { doc.addPage(); y = 45; }
          doc.fillColor(BLUE).fontSize(8).font('Helvetica')
            .text(`Photo ${i + 1}: ${url}`, 50, y, { width: pageW - 10, link: url });
          y += 14;
        });
      }

      // ── Footer ──
      const footerY = doc.page.height - 40;
      doc.moveTo(45, footerY - 8).lineTo(45 + pageW, footerY - 8).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      doc.fillColor(GRAY).fontSize(8).font('Helvetica')
        .text(`Generated by Parity Homes Property Onboarding App  ·  Record ID: ${v(insp.id)}`, 45, footerY, { width: pageW, align: 'center' });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

// ─── ACTION ITEMS ─────────────────────────────────────────────────────────────

function buildActionItems(insp) {
  const items = [];
  if (['B - Minimal','C - Moderate','D - Significant'].includes(insp.historicalFabric))
    items.push({ text: 'Schedule stabilization', urgent: false });
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

// ─── EMAIL HTML ───────────────────────────────────────────────────────────────

const PHOTO_LABELS = {
  property: 'Property', frontFacade: 'Front Facade', structuralDamage: 'Structural Damage',
  historicalFabric: 'Historical Fabric', facade: 'Facade', facadeCondition: 'Facade Condition',
  corniceCondition: 'Cornice', frontEntry: 'Front Entry', frontDoorCondition: 'Front Door',
  frontWindowsCondition: 'Front Windows', rear: 'Rear', rearWallCondition: 'Rear Wall',
  rearDoorCondition: 'Rear Door', rearWindowCondition: 'Rear Windows', roof: 'Roof',
  roofCondition: 'Roof Condition', utilities: 'Utilities', site: 'Site',
  backYardCondition: 'Back Yard', squatterSigns: 'Squatter Signs', notes: 'Notes',
};

function row(label, value) {
  return `<tr>
    <td style="padding:8px 12px;font-size:13px;color:#6b7280;width:40%;vertical-align:top;border-bottom:1px solid #f3f4f6">${label}</td>
    <td style="padding:8px 12px;font-size:13px;color:#111827;vertical-align:top;border-bottom:1px solid #f3f4f6">${value}</td>
  </tr>`;
}

function section(title, content) {
  return `<div style="margin-bottom:24px">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#1a4fa0;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #eff6ff">${title}</div>
    <table style="width:100%;border-collapse:collapse">${content}</table>
  </div>`;
}

function buildPhotosSection(insp) {
  const photos = insp.photos || {};
  const entries = Object.entries(photos).filter(([, arr]) =>
    Array.isArray(arr) && arr.some(src => src && src.startsWith('https://'))
  );
  if (!entries.length) return '';
  const photoRows = entries.map(([key, imgs]) => {
    const urls = imgs.filter(src => src && src.startsWith('https://'));
    if (!urls.length) return '';
    const label = PHOTO_LABELS[key] || key;
    const imgTags = urls.map(url =>
      `<img src="${url}" alt="${label}" width="220" height="165" style="width:220px;height:165px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;display:inline-block;">`
    ).join('&nbsp;');
    return `<div style="margin-bottom:16px">
      <div style="font-size:12px;font-weight:600;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">${label}</div>
      <div>${imgTags}</div>
    </div>`;
  }).filter(Boolean).join('');
  if (!photoRows) return '';
  return `<div style="margin-bottom:24px">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#1a4fa0;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #eff6ff">Photos</div>
    ${photoRows}
  </div>`;
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
      ${urgentItems.map(i => `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 10px;background:#fef2f2;border-left:3px solid #dc2626;border-radius:0 6px 6px 0;margin-bottom:6px;font-size:13px"><span style="color:#dc2626;font-weight:700;white-space:nowrap">⚠ Urgent</span><span style="color:#111827">${i.text}</span></div>`).join('')}
      ${normalItems.map(i => `<div style="padding:8px 10px;background:#f9fafb;border-left:3px solid #d1d5db;border-radius:0 6px 6px 0;margin-bottom:6px;font-size:13px;color:#111827">${i.text}</div>`).join('')}
    </div>` : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:680px;margin:24px auto;background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <div style="background:#1a4fa0;padding:28px 32px">
    <div style="font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:6px">Parity Homes</div>
    <div style="font-size:24px;font-weight:800;color:white;letter-spacing:-0.3px">Property Onboarding Report</div>
    <div style="margin-top:12px;font-size:13px;color:rgba(255,255,255,0.85)">${v(insp.address)}${insp.neighborhood ? ' &bull; ' + insp.neighborhood : ''}</div>
  </div>
  <div style="background:#eff6ff;padding:12px 32px;font-size:12px;color:#1a4fa0;border-bottom:1px solid #dbeafe">
    📅 ${date} &nbsp;&nbsp; 👤 ${v(insp.inspectorName)} &nbsp;&nbsp; 🕐 Submitted ${submitted}
  </div>
  <div style="padding:28px 32px">
    ${actionHTML}
    ${section('Structure & Overview', row('Structural Damage', v(insp.structuralDamage)) + row('Historical Fabric', v(insp.historicalFabric)) + row('Elevation — 1st Floor', v(insp.elevationHeight1stFloor)) + row('Elevation — 2nd Floor', v(insp.elevationHeight2ndFloor)) + row('Elevation — 3rd Floor', v(insp.elevationHeight3rdFloor)) + (insp.notes ? row('Notes', v(insp.notes)) : ''))}
    ${section('Facade', row('Facade Condition', v(insp.facadeCondition)) + row('Facade Material', v(insp.facadeMaterial)) + row('Cornice Condition', v(insp.corniceCondition)))}
    ${section('Front Entry', row('Front Door Condition', v(insp.frontDoorCondition)) + row('Front Door Material', v(insp.frontDoorMaterial)) + row('Front Padlock', v(insp.frontPadlock)) + row('Front Windows', v(insp.frontWindowsCondition)) + row('English Basement', v(insp.englishBasement)))}
    ${section('Rear', row('Rear Wall Condition', v(insp.rearWallCondition)) + row('Rear Door Condition', v(insp.rearDoorCondition)) + row('Rear Padlock', v(insp.rearPadlock)) + row('Rear Window Condition', v(insp.rearWindowCondition)))}
    ${section('Roof & Utilities', row('Roof Condition', v(insp.roofCondition)) + row('Electrical Line Location', v(insp.electricalLineLocation)) + row('Electrical Line Elevation', v(insp.electricalLineElevation)) + row('Sewer Line Location', v(insp.sewerLineLocation)) + row('Water Line — City Side', v(insp.waterLineCitySide)) + row('Water Line — House Side', v(insp.waterLineHouseSide)) + row('Water Meter Present', v(insp.waterMeterPresent)))}
    ${section('Site Conditions', row('Back Yard Condition', arr(insp.backYardCondition)) + row('Hazards to Pedestrians', v(insp.hazardsPresent) + (insp.hazardsPresent === 'Yes' && insp.hazardsToPedestrians ? ': ' + insp.hazardsToPedestrians : '')) + row('Squatter Signs', arr(insp.squatterSigns)) + (insp.squatterOther ? row('Squatter Notes', v(insp.squatterOther)) : ''))}
    ${buildPhotosSection(insp)}
  </div>
  <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">
    Generated by Parity Homes Property Onboarding App &bull; Record ID: ${v(insp.id)} &bull; PDF report attached
  </div>
</div>
</body></html>`;
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const insp = req.body;
  if (!insp || !insp.address) {
    return res.status(400).json({ error: 'Invalid inspection data' });
  }

  try {
    // Generate PDF attachment
    let attachments = [];
    try {
      const pdfBuffer = await generatePDF(insp);
      const slug = (insp.address || 'inspection').replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 40);
      attachments = [{
        filename: `parity_report_${slug}.pdf`,
        content: pdfBuffer.toString('base64'),
      }];
    } catch (pdfErr) {
      console.error('PDF generation failed (sending email without attachment):', pdfErr);
    }

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: RECIPIENTS,
      subject: `Property Onboarding Report — ${insp.address}${insp.inspectionDate ? ' (' + insp.inspectionDate + ')' : ''}`,
      html: buildEmailHTML(insp),
      attachments,
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
