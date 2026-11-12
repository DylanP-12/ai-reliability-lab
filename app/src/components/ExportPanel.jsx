// L058: export panel. Says what is in the package BEFORE the click, then downloads one JSON file.
import { useState } from 'react';
import { dataStore } from '../lib/dataStore.js';
import { buildExportPackage, loadExportInput } from '../lib/exportPackage.js';
function downloadJson(pkg, filename) {
  const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ExportPanel() {
  const [state, setState] = useState({ status: 'idle' });

  async function handleExport() {
    setState({ status: 'working' });
    try {
      const input = await loadExportInput(dataStore);
      const pkg = buildExportPackage({ ...input, exportedAt: new Date().toISOString() });
      downloadJson(pkg, `ai-reliability-lab-export_${pkg.manifest.run_id}.json`);
      setState({ status: 'done', units: pkg.units.length });
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  }

  return (
    <div className="export">
      <p>One JSON file that lets a reader check and re-derive the results.</p>
      <p><strong>Included:</strong> the run manifest (run id, dataset hash, seed, models, counts), the
        scenarios without private notes, the rubric, every unit's turns with response text exactly as
        recorded, every judge result including unparseable ones, the aggregates with their denominators,
        and a README stating the combine rules and limitations.</p>
      <p><strong>Never included:</strong> API keys, private evaluation notes, run configuration, or the raw
        frozen files (ask for those separately).</p>
      <button type="button" onClick={handleExport} disabled={state.status === 'working'}>
        {state.status === 'working' ? 'Building package...' : 'Download research package'}
      </button>
      {state.status === 'done' && <p role="status">Downloaded a package with {state.units} units.</p>}
      {state.status === 'error' && <p className="error">Export failed: {state.message}</p>}
    </div>
  );
}