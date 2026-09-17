import { Plus, X } from 'lucide-react';
import { parseTable, serializeTable, addTableRow, removeTableRow, addTableColumn, removeTableColumn, setHeaderCell, setBodyCell } from './table';

export default function TableWidget({ text, onChange }: { text: string; onChange: (text: string) => void }) {
  const table = parseTable(text);

  return (
    <div className="table-widget">
      <table>
        <thead>
          <tr>
            {table.headers.map((h, ci) => (
              <th key={ci}>
                <input value={h} onChange={e => onChange(serializeTable(setHeaderCell(table, ci, e.target.value)))}/>
                <button className="table-col-remove" title="Remove column" onClick={() => onChange(serializeTable(removeTableColumn(table, ci)))}><X size={11}/></button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>
                  <input value={cell} onChange={e => onChange(serializeTable(setBodyCell(table, ri, ci, e.target.value)))}/>
                </td>
              ))}
              <td className="table-row-remove-cell"><button title="Remove row" onClick={() => onChange(serializeTable(removeTableRow(table, ri)))}><X size={11}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-controls">
        <button onClick={() => onChange(serializeTable(addTableRow(table)))}><Plus size={12}/> Row</button>
        <button onClick={() => onChange(serializeTable(addTableColumn(table)))}><Plus size={12}/> Column</button>
      </div>
    </div>
  );
}
