import React from 'react';
const Select = ({ label, value, onChange, options, disabled }) => (
  <div>
    {label && <label className="block mb-1 text-sm font-medium">{label}</label>}
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded border px-3 py-2 focus:ring"
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);
export default Select;
