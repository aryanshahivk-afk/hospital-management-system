import * as XLSX from "xlsx";

const CURRENCY_FMT = "#,##0";

function applyNumberFormat(sheet, colIndex, startRow, endRow, fmt) {
  for (let r = startRow; r <= endRow; r++) {
    const ref = XLSX.utils.encode_cell({ r, c: colIndex });
    if (sheet[ref]) sheet[ref].z = fmt;
  }
}

// Builds a clean, three-sheet workbook (Summary / Revenue Trend / Department Occupancy)
// from the exact same data already shown on the Reports page. Each sheet has a single
// header row, one data row per record — no merged/blended layout — and real numeric
// cells (not text) with proper column widths and number formats, so it opens cleanly
// in Excel/Google Sheets and totals/sorts correctly if the person works with it further.
export function exportReportToExcel({ dashboardStats, revenueTrend, departmentLoad }) {
  const wb = XLSX.utils.book_new();
  const generatedOn = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });

  // ---------- Summary sheet ----------
  const summaryRows = [
    [`HMS Report — generated ${generatedOn}`],
    [],
    ["Metric", "Value"],
    ["Revenue this month (NPR)", dashboardStats.revenueThisMonth],
    ["Outstanding balance (NPR)", dashboardStats.outstandingBalance],
    ["Total patients", dashboardStats.totalPatients],
    ["Active doctors", dashboardStats.activeDoctors],
    ["Today's appointments", dashboardStats.todayAppointments],
    ["EMI applications pending", dashboardStats.pendingEmiApprovals],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 30 }, { wch: 18 }];
  applyNumberFormat(summarySheet, 1, 3, 4, CURRENCY_FMT);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // ---------- Revenue Trend sheet ----------
  const revenueRows = [
    ["Month", "Total Revenue (NPR)", "EMI Collections (NPR)"],
    ...revenueTrend.map((r) => [r.month, r.revenue, r.emi]),
  ];
  const revenueSheet = XLSX.utils.aoa_to_sheet(revenueRows);
  revenueSheet["!cols"] = [{ wch: 14 }, { wch: 20 }, { wch: 20 }];
  applyNumberFormat(revenueSheet, 1, 1, revenueRows.length - 1, CURRENCY_FMT);
  applyNumberFormat(revenueSheet, 2, 1, revenueRows.length - 1, CURRENCY_FMT);
  XLSX.utils.book_append_sheet(wb, revenueSheet, "Revenue Trend");

  // ---------- Department Occupancy sheet ----------
  const deptRows = [
    ["Department", "Occupied Beds"],
    ...departmentLoad.map((d) => [d.name, d.value]),
  ];
  const deptSheet = XLSX.utils.aoa_to_sheet(deptRows);
  deptSheet["!cols"] = [{ wch: 24 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, deptSheet, "Department Occupancy");

  const filename = `HMS-Report-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
