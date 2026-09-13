"use client";

export function TenantIdFields({
  idType,
  idNumber,
  onIdTypeChange,
  onIdNumberChange,
}: {
  idType: string;
  idNumber: string;
  onIdTypeChange: (value: string) => void;
  onIdNumberChange: (value: string) => void;
}) {
  const numberLabel = idType === "passport" ? "Passport number" : "ID / passport number";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label">ID type</label>
        <select className="field" value={idType} onChange={(e) => onIdTypeChange(e.target.value)}>
          <option value="">Not recorded</option>
          <option value="national_id">National ID</option>
          <option value="passport">Passport</option>
        </select>
      </div>
      <div>
        <label className="label">{numberLabel}</label>
        <input
          className="field"
          placeholder="Optional"
          value={idNumber}
          onChange={(e) => onIdNumberChange(e.target.value)}
          autoCapitalize="characters"
        />
      </div>
    </div>
  );
}
