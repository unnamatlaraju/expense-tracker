import { escapeHtml, formatCurrency, formatDate } from "@/lib/format"
import type { Schedule } from "@/lib/loans"
import type { Expense } from "@/lib/types"

const download = (content: string, type: string, filename: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const exportToCSV = (expenses: Expense[]) => {
  const rows = [
    ["Date", "Description", "Category", "Amount"],
    ...expenses.map((e) => [e.date, e.description, e.category, e.amount.toString()]),
  ]
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n")
  download(csv, "text/csv", "expenses.csv")
}

/** Sanitises a loan name into something safe to use as a filename. */
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "loan"

/**
 * The amortisation schedule as a spreadsheet, so the maths can be checked in
 * Excel or handed to a lender.
 */
export const exportScheduleToCSV = (name: string, schedule: Schedule) => {
  const rows = [
    ["Instalment", "Due date", "Opening balance", "Payment", "Interest", "Principal", "Closing balance"],
    ...schedule.instalments.map((row) => [
      String(row.number),
      row.due,
      row.opening.toFixed(2),
      row.payment.toFixed(2),
      row.interest.toFixed(2),
      row.principal.toFixed(2),
      row.closing.toFixed(2),
    ]),
    [],
    ["Total interest", schedule.totalInterest.toFixed(2)],
    ["Total payable", schedule.totalPayable.toFixed(2)],
  ]
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n")
  download(csv, "text/csv", `${slugify(name)}-schedule.csv`)
}

export const exportToHTMLReport = (
  expenses: Expense[],
  filters: { startDate?: string; endDate?: string; category?: string },
) => {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const html = `<html>
  <head>
    <title>Expense Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      .total { font-weight: bold; margin-top: 20px; }
    </style>
  </head>
  <body>
    <h1>Personal Expense Report</h1>
    <p>Generated on: ${new Date().toLocaleDateString("en-IN")}</p>
    ${filters.startDate ? `<p>From: ${escapeHtml(filters.startDate)}</p>` : ""}
    ${filters.endDate ? `<p>To: ${escapeHtml(filters.endDate)}</p>` : ""}
    ${filters.category ? `<p>Category: ${escapeHtml(filters.category)}</p>` : ""}
    <table>
      <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount (₹)</th></tr></thead>
      <tbody>
        ${expenses
          .map(
            (e) =>
              `<tr><td>${formatDate(e.date)}</td><td>${escapeHtml(e.description)}</td><td>${escapeHtml(e.category)}</td><td>${formatCurrency(e.amount)}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
    <div class="total">Total: ${formatCurrency(total)}</div>
  </body>
</html>`
  download(html, "text/html", "expense-report.html")
}
