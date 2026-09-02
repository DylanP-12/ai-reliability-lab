export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }   // escaped quote: append one literal ", skip both
        else inQuotes = false;                              // real closing quote
      } else {
        field += c;                                          // inside quotes: everything is data, even , and \n
      }
    } else {
      if (c === '"' && field === '') inQuotes = true;        // opening quote, only valid at field start
      else if (c === ',') { row.push(field); field = ''; }    // end field
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }  // end field + row
      else if (c === '\r') { /* swallow; \n handles the row */ }
      else field += c;                                        // ordinary character
    }
  }

  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }  // flush last row if no trailing \n
  return rows;
}