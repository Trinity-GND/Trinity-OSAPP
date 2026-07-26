"use client";

import { useCallback, useEffect, useState } from "react";

type PayrollEntry = {
  id: string;
  name: string;
  monthly_salary: number;
  days_to_be_paid: number;
  days_present: number;
  advance: number;
};

type ExpenseEntry = { id: string; category: string; amount: number };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function computed(e: PayrollEntry) {
  const perDay = e.days_to_be_paid > 0 ? e.monthly_salary / e.days_to_be_paid : 0;
  const amount = perDay * e.days_present;
  const payable = amount - e.advance;
  return { perDay, amount, payable };
}

export default function PayrollPanel() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [payroll, setPayroll] = useState<PayrollEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [pRes, eRes] = await Promise.all([
        fetch(`/api/payroll?year=${year}&month=${month}`),
        fetch(`/api/expenses?year=${year}&month=${month}`),
      ]);
      if (!pRes.ok || !eRes.ok) throw new Error();
      setPayroll((await pRes.json()).entries);
      setExpenses((await eRes.json()).entries);
      setError(null);
    } catch {
      setError("Couldn't load payroll/expenses for this month.");
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  function changeMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) {
      m = 1;
      y++;
    } else if (m < 1) {
      m = 12;
      y--;
    }
    setMonth(m);
    setYear(y);
  }

  async function addPayrollRow() {
    const res = await fetch("/api/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, name: "" }),
    });
    if (res.ok) load();
  }

  async function updatePayrollRow(id: string, patch: Record<string, unknown>) {
    setPayroll((prev) => prev.map((e) => (e.id === id ? { ...e, ...mapPatch(patch) } : e)));
    await fetch(`/api/payroll/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function removePayrollRow(id: string) {
    setPayroll((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/payroll/${id}`, { method: "DELETE" });
  }

  async function addExpenseRow() {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, category: "" }),
    });
    if (res.ok) load();
  }

  async function updateExpenseRow(id: string, patch: Record<string, unknown>) {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...(patch as Partial<ExpenseEntry>) } : e)),
    );
    await fetch(`/api/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function removeExpenseRow(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
  }

  const payrollTotal = payroll.reduce((sum, e) => sum + computed(e).payable, 0);
  const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const grandTotal = payrollTotal + expensesTotal;

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button onClick={() => changeMonth(-1)} className="px-2 py-1 border rounded hover:bg-gray-100">
          ←
        </button>
        <span className="text-sm font-medium">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button onClick={() => changeMonth(1)} className="px-2 py-1 border rounded hover:bg-gray-100">
          →
        </button>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Payroll (₹)</h3>
        <div className="border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Monthly Salary</th>
                <th className="p-2">Days to be Paid</th>
                <th className="p-2">Days Present</th>
                <th className="p-2">Advance</th>
                <th className="p-2">Per Day</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Payable</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {payroll.map((e) => {
                const c = computed(e);
                return (
                  <tr key={e.id} className="border-t">
                    <td className="p-1">
                      <input
                        className="border rounded px-1 py-0.5 text-sm w-28"
                        defaultValue={e.name}
                        onBlur={(ev) => updatePayrollRow(e.id, { name: ev.target.value })}
                      />
                    </td>
                    <td className="p-1">
                      <NumInput value={e.monthly_salary} onCommit={(v) => updatePayrollRow(e.id, { monthlySalary: v })} />
                    </td>
                    <td className="p-1">
                      <NumInput value={e.days_to_be_paid} onCommit={(v) => updatePayrollRow(e.id, { daysToBePaid: v })} />
                    </td>
                    <td className="p-1">
                      <NumInput value={e.days_present} onCommit={(v) => updatePayrollRow(e.id, { daysPresent: v })} />
                    </td>
                    <td className="p-1">
                      <NumInput value={e.advance} onCommit={(v) => updatePayrollRow(e.id, { advance: v })} />
                    </td>
                    <td className="p-2">₹{c.perDay.toFixed(2)}</td>
                    <td className="p-2">₹{c.amount.toFixed(2)}</td>
                    <td className="p-2 font-medium">₹{c.payable.toFixed(2)}</td>
                    <td className="p-2">
                      <button onClick={() => removePayrollRow(e.id)} className="text-xs text-red-600 hover:underline">
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button onClick={addPayrollRow} className="mt-2 text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100">
          + Add Person
        </button>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Operating Expenses (₹)</h3>
        <div className="border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="p-2">Category</th>
                <th className="p-2">Amount</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="p-1">
                    <input
                      className="border rounded px-1 py-0.5 text-sm w-40"
                      defaultValue={e.category}
                      onBlur={(ev) => updateExpenseRow(e.id, { category: ev.target.value })}
                    />
                  </td>
                  <td className="p-1">
                    <NumInput value={e.amount} onCommit={(v) => updateExpenseRow(e.id, { amount: v })} />
                  </td>
                  <td className="p-2">
                    <button onClick={() => removeExpenseRow(e.id)} className="text-xs text-red-600 hover:underline">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addExpenseRow} className="mt-2 text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100">
          + Add Expense
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded p-3">
          <p className="text-xs text-gray-500">Payroll Total</p>
          <p className="text-lg font-semibold">₹{payrollTotal.toFixed(2)}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs text-gray-500">Operating Total</p>
          <p className="text-lg font-semibold">₹{expensesTotal.toFixed(2)}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs text-gray-500">Grand Total</p>
          <p className="text-lg font-semibold">₹{grandTotal.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

function mapPatch(patch: Record<string, unknown>) {
  const map: Record<string, string> = {
    monthlySalary: "monthly_salary",
    daysToBePaid: "days_to_be_paid",
    daysPresent: "days_present",
    advance: "advance",
    name: "name",
  };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    out[map[k] ?? k] = v;
  }
  return out;
}

function NumInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);
  return (
    <input
      type="number"
      className="border rounded px-1 py-0.5 text-sm w-24"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onCommit(Number(local) || 0)}
    />
  );
}
