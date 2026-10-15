import { escapeHtml, formatCurrency, formatDate } from "@/lib/format"
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
    ${filters.startDate ? `<p>From: ${filters.startDate}</p>` : ""}
    ${filters.endDate ? `<p>To: ${filters.endDate}</p>` : ""}
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
