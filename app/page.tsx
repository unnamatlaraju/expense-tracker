"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, LucidePieChart, BarChart3, FileText, Download, Repeat } from "lucide-react"
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  isRecurring?: boolean
  recurringFrequency?: "monthly" | "weekly" | "yearly"
}

interface Budget {
  category: string
  limit: number
  spent: number
}

interface RecurringExpense {
  id: string
  description: string
  amount: number
  category: string
  frequency: "monthly" | "weekly" | "yearly"
  nextDue: string
  isActive: boolean
}

const DEFAULT_CATEGORIES = [
  "Rent",
  "Electricity Bill",
  "Rice Packets",
  "Tiffin/Meals",
  "Night Curry/Dinner",
  "Transport",
  "Snacks",
  "Others",
]

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const CHART_COLORS = ["#d97706", "#15803d", "#ec4899", "#84cc16", "#be123c", "#3b82f6", "#8b5cf6", "#f59e0b"]

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
  const [currentPage, setCurrentPage] = useState<"tracker" | "summary" | "budget" | "recurring" | "reports">("tracker")

  // Form states
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0])
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [newCategory, setNewCategory] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState<"monthly" | "weekly" | "yearly">("monthly")

  // Budget form states
  const [budgetCategory, setBudgetCategory] = useState(DEFAULT_CATEGORIES[0])
  const [budgetLimit, setBudgetLimit] = useState("")

  // Report filter states
  const [reportStartDate, setReportStartDate] = useState("")
  const [reportEndDate, setReportEndDate] = useState("")
  const [reportCategory, setReportCategory] = useState("")

  const [isLoaded, setIsLoaded] = useState(false)

  // Load data from localStorage
  useEffect(() => {
    const savedExpenses = localStorage.getItem("expenses")
    const savedCategories = localStorage.getItem("categories")
    const savedBudgets = localStorage.getItem("budgets")
    const savedRecurring = localStorage.getItem("recurringExpenses")

    if (savedExpenses) setExpenses(JSON.parse(savedExpenses))
    if (savedCategories) setCategories(JSON.parse(savedCategories))
    if (savedBudgets) setBudgets(JSON.parse(savedBudgets))
    if (savedRecurring) setRecurringExpenses(JSON.parse(savedRecurring))
    setIsLoaded(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem("expenses", JSON.stringify(expenses))
  }, [expenses, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem("categories", JSON.stringify(categories))
  }, [categories, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem("budgets", JSON.stringify(budgets))
  }, [budgets, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem("recurringExpenses", JSON.stringify(recurringExpenses))
  }, [recurringExpenses, isLoaded])

  const addExpense = () => {
    if (!description || !amount || !category || !date) {
      alert("Please fill in all fields")
      return
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      description,
      amount: Number.parseFloat(amount),
      category,
      date,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
    }

    setExpenses([...expenses, newExpense])

    // If it's recurring, add to recurring expenses
    if (isRecurring) {
      const nextDue = calculateNextDue(date, recurringFrequency)
      const newRecurring: RecurringExpense = {
        id: Date.now().toString() + "_recurring",
        description,
        amount: Number.parseFloat(amount),
        category,
        frequency: recurringFrequency,
        nextDue,
        isActive: true,
      }
      setRecurringExpenses([...recurringExpenses, newRecurring])
    }

    // Reset form
    setDescription("")
    setAmount("")
    setCategory(DEFAULT_CATEGORIES[0])
    setDate(new Date().toISOString().split("T")[0])
    setIsRecurring(false)
    setRecurringFrequency("monthly")
  }

  const calculateNextDue = (currentDate: string, frequency: "monthly" | "weekly" | "yearly") => {
    const date = new Date(currentDate)
    switch (frequency) {
      case "weekly":
        date.setDate(date.getDate() + 7)
        break
      case "monthly":
        date.setMonth(date.getMonth() + 1)
        break
      case "yearly":
        date.setFullYear(date.getFullYear() + 1)
        break
    }
    return date.toISOString().split("T")[0]
  }

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
  }

  const addCustomCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory])
      setNewCategory("")
    }
  }

  const addBudget = () => {
    if (!budgetCategory || !budgetLimit) {
      alert("Please fill in all budget fields")
      return
    }

    const existingBudgetIndex = budgets.findIndex((b) => b.category === budgetCategory)
    const categorySpent = getCategoryTotal(budgetCategory)

    if (existingBudgetIndex >= 0) {
      const updatedBudgets = [...budgets]
      updatedBudgets[existingBudgetIndex] = {
        category: budgetCategory,
        limit: Number.parseFloat(budgetLimit),
        spent: categorySpent,
      }
      setBudgets(updatedBudgets)
    } else {
      setBudgets([
        ...budgets,
        {
          category: budgetCategory,
          limit: Number.parseFloat(budgetLimit),
          spent: categorySpent,
        },
      ])
    }

    setBudgetCategory(DEFAULT_CATEGORIES[0])
    setBudgetLimit("")
  }

  const toggleRecurringExpense = (id: string) => {
    setRecurringExpenses(
      recurringExpenses.map((expense) => (expense.id === id ? { ...expense, isActive: !expense.isActive } : expense)),
    )
  }

  const deleteRecurringExpense = (id: string) => {
    setRecurringExpenses(recurringExpenses.filter((expense) => expense.id !== id))
  }

  const processRecurringExpense = (recurringExpense: RecurringExpense) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      description: recurringExpense.description,
      amount: recurringExpense.amount,
      category: recurringExpense.category,
      date: new Date().toISOString().split("T")[0],
      isRecurring: true,
      recurringFrequency: recurringExpense.frequency,
    }

    setExpenses([...expenses, newExpense])

    // Update next due date
    const nextDue = calculateNextDue(recurringExpense.nextDue, recurringExpense.frequency)
    setRecurringExpenses(
      recurringExpenses.map((expense) => (expense.id === recurringExpense.id ? { ...expense, nextDue } : expense)),
    )
  }

  const getFilteredExpenses = () => {
    return expenses.filter((expense) => {
      const matchesDateRange =
        (!reportStartDate || expense.date >= reportStartDate) && (!reportEndDate || expense.date <= reportEndDate)
      const matchesCategory = reportCategory === "all" || !reportCategory || expense.category === reportCategory
      return matchesDateRange && matchesCategory
    })
  }

  const exportToCSV = () => {
    const filteredExpenses = getFilteredExpenses()
    const csvContent = [
      ["Date", "Description", "Category", "Amount"],
      ...filteredExpenses.map((expense) => [
        expense.date,
        expense.description,
        expense.category,
        expense.amount.toString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "expenses.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
    const filteredExpenses = getFilteredExpenses()
    const content = `
      <html>
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
          ${reportStartDate ? `<p>From: ${reportStartDate}</p>` : ""}
          ${reportEndDate ? `<p>To: ${reportEndDate}</p>` : ""}
          ${reportCategory ? `<p>Category: ${escapeHtml(reportCategory)}</p>` : ""}
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses
                .map(
                  (expense) => `
                <tr>
                  <td>${new Date(expense.date).toLocaleDateString("en-IN")}</td>
                  <td>${escapeHtml(expense.description)}</td>
                  <td>${escapeHtml(expense.category)}</td>
                  <td>${formatCurrency(expense.amount)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="total">
            Total: ${formatCurrency(filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0))}
          </div>
        </body>
      </html>
    `

    const blob = new Blob([content], { type: "text/html" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "expense-report.html"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  const getCategoryTotal = (categoryName: string) => {
    return expenses
      .filter((expense) => expense.category === categoryName)
      .reduce((sum, expense) => sum + expense.amount, 0)
  }

  const getCategoryData = () => {
    const categoryTotals = categories
      .map((category) => ({
        name: category,
        value: getCategoryTotal(category),
      }))
      .filter((item) => item.value > 0)

    return categoryTotals
  }

  const getMonthlyData = () => {
    const monthlyTotals: { [key: string]: number } = {}

    expenses.forEach((expense) => {
      const month = new Date(expense.date).toLocaleDateString("en-IN", { year: "numeric", month: "short" })
      monthlyTotals[month] = (monthlyTotals[month] || 0) + expense.amount
    })

    return Object.entries(monthlyTotals)
      .map(([month, total]) => ({
        month,
        total,
      }))
      .slice(-6)
  }

  useEffect(() => {
    setBudgets((prevBudgets) =>
      prevBudgets.map((budget) => ({
        ...budget,
        spent: expenses
          .filter((expense) => expense.category === budget.category)
          .reduce((sum, expense) => sum + expense.amount, 0),
      })),
    )
  }, [expenses])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Personal Expense Tracker</h1>
          <div className="flex gap-2">
            <Button
              variant={currentPage === "tracker" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage("tracker")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
            <Button
              variant={currentPage === "summary" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage("summary")}
            >
              <LucidePieChart className="w-4 h-4 mr-2" />
              Summary
            </Button>
            <Button
              variant={currentPage === "budget" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage("budget")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Budget
            </Button>
            <Button
              variant={currentPage === "recurring" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage("recurring")}
            >
              <Repeat className="w-4 h-4 mr-2" />
              Recurring
            </Button>
            <Button
              variant={currentPage === "reports" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage("reports")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {currentPage === "tracker" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Expense Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Expense</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Enter expense description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="recurring" checked={isRecurring} onCheckedChange={(checked) => setIsRecurring(checked === true)} />
                  <Label htmlFor="recurring">This is a recurring expense</Label>
                </div>

                {isRecurring && (
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={recurringFrequency} onValueChange={(value) => setRecurringFrequency(value as "monthly" | "weekly" | "yearly")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={addExpense} className="w-full">
                  Add Expense
                </Button>

                <div className="pt-4 border-t">
                  <Label htmlFor="newCategory">Add Custom Category</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="newCategory"
                      placeholder="Enter new category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <Button onClick={addCustomCategory} size="sm">
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Expenses */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {expenses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No expenses added yet. Start by adding your first expense!
                    </p>
                  ) : (
                    expenses
                      .slice()
                      .reverse()
                      .map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{expense.description}</span>
                              {expense.isRecurring && (
                                <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                                  <Repeat className="w-3 h-3 inline mr-1" />
                                  {expense.recurringFrequency}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {expense.category} • {new Date(expense.date).toLocaleDateString("en-IN")}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">{formatCurrency(expense.amount)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteExpense(expense.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Expenses:</span>
                    <span className="text-primary">{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentPage === "summary" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{formatCurrency(totalExpenses)}</div>
                  <p className="text-muted-foreground">All time total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">
                    {formatCurrency(
                      expenses
                        .filter((expense) => {
                          const expenseMonth = new Date(expense.date).getMonth()
                          const currentMonth = new Date().getMonth()
                          return expenseMonth === currentMonth
                        })
                        .reduce((sum, expense) => sum + expense.amount, 0),
                    )}
                  </div>
                  <p className="text-muted-foreground">Current month spending</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-chart-3">{getCategoryData().length}</div>
                  <p className="text-muted-foreground">Active categories</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {getCategoryData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie data={getCategoryData()} dataKey="value" nameKey="name" outerRadius={100} label>
                          {getCategoryData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No expense data to display
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Spending Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {getMonthlyData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getMonthlyData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="total" fill="#15803d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No monthly data to display
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getCategoryData().map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(category.value)}</div>
                        <div className="text-sm text-muted-foreground">
                          {((category.value / totalExpenses) * 100).toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentPage === "budget" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Set Category Budget</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="budgetCategory">Category</Label>
                    <Select value={budgetCategory} onValueChange={setBudgetCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="budgetLimit">Monthly Budget Limit (₹)</Label>
                    <Input
                      id="budgetLimit"
                      type="number"
                      placeholder="0.00"
                      value={budgetLimit}
                      onChange={(e) => setBudgetLimit(e.target.value)}
                    />
                  </div>

                  <Button onClick={addBudget} className="w-full">
                    Set Budget
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {budgets.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No budgets set yet. Start by setting a budget for a category!
                      </p>
                    ) : (
                      budgets.map((budget) => {
                        const percentage = (budget.spent / budget.limit) * 100
                        const isOverBudget = budget.spent > budget.limit

                        return (
                          <div key={budget.category} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{budget.category}</span>
                              <span
                                className={`text-sm ${isOverBudget ? "text-destructive" : "text-muted-foreground"}`}
                              >
                                {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  isOverBudget ? "bg-destructive" : percentage > 80 ? "bg-accent" : "bg-primary"
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            {isOverBudget && (
                              <p className="text-sm text-destructive">
                                ⚠️ Over budget by {formatCurrency(budget.spent - budget.limit)}
                              </p>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentPage === "recurring" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recurring Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recurringExpenses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No recurring expenses set up yet. Add an expense and mark it as recurring to get started!
                    </p>
                  ) : (
                    recurringExpenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{expense.description}</span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                expense.isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted-foreground text-background"
                              }`}
                            >
                              {expense.frequency}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {expense.category} • Next due: {new Date(expense.nextDue).toLocaleDateString("en-IN")}
                          </div>
                          <div className="text-lg font-semibold">{formatCurrency(expense.amount)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRecurringExpense(expense.id)}
                            className={expense.isActive ? "text-muted-foreground" : "text-primary"}
                          >
                            {expense.isActive ? "Pause" : "Resume"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => processRecurringExpense(expense)}
                            disabled={!expense.isActive}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Now
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRecurringExpense(expense.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentPage === "reports" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filter & Export Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reportCategory">Category</Label>
                    <Select value={reportCategory} onValueChange={setReportCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={exportToCSV} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button onClick={exportToPDF} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Filtered Expenses ({getFilteredExpenses().length} items) - Total:{" "}
                  {formatCurrency(getFilteredExpenses().reduce((sum, expense) => sum + expense.amount, 0))}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getFilteredExpenses().length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No expenses match the current filters.</p>
                  ) : (
                    getFilteredExpenses()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{expense.description}</span>
                              {expense.isRecurring && (
                                <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                                  <Repeat className="w-3 h-3 inline mr-1" />
                                  {expense.recurringFrequency}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {expense.category} • {new Date(expense.date).toLocaleDateString("en-IN")}
                            </div>
                          </div>
                          <div className="font-semibold text-lg">{formatCurrency(expense.amount)}</div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
