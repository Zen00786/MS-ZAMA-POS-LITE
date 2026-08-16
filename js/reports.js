/* ==========================================
   Sales summaries and reports
========================================== */

let selectedReportPeriod = "all";
let customReportRange = { from: "", to: "", error: "" };

function toNumber(value){
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function getLocalNumericDateOrder(){
    const sample = new Date(2001, 10, 22).toLocaleDateString();
    const match = sample.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);

    if(!match) return null;
    if(Number(match[1]) === 22) return "day-month";
    if(Number(match[2]) === 22) return "month-day";
    return null;
}

/* Bills are historically saved with Date#toLocaleString(). Keep that format
   unchanged, but parse it defensively before comparing calendar days. */
function parseSavedBillDate(value){
    if(value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value.getTime());
    if(typeof value === "number"){
        const timestampDate = new Date(value);
        return Number.isNaN(timestampDate.getTime()) ? null : timestampDate;
    }
    if(typeof value !== "string" || value.trim() === "") return null;

    const match = value.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[^\d]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?/i);
    if(!match){
        const parsedDate = new Date(value);
        return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    let first = Number(match[1]);
    let second = Number(match[2]);
    const year = Number(match[3]);
    let hour = Number(match[4] || 0);
    const minute = Number(match[5] || 0);
    const secondValue = Number(match[6] || 0);
    const meridiem = (match[7] || "").toUpperCase();
    let month = first;
    let day = second;

    /* Indian locale dates are commonly day/month/year; handle unambiguous
       values when the browser cannot parse the saved locale string. */
    if(first > 12 && second <= 12){
        day = first;
        month = second;
    }else if(second > 12 && first <= 12){
        month = first;
        day = second;
    }else if(getLocalNumericDateOrder() === "day-month"){
        day = first;
        month = second;
    }
    if(meridiem === "PM" && hour < 12) hour += 12;
    else if(meridiem === "AM" && hour === 12) hour = 0;

    const localDate = new Date(year, month - 1, day, hour, minute, secondValue);
    if(localDate.getFullYear() !== year || localDate.getMonth() !== month - 1 || localDate.getDate() !== day) return null;
    return localDate;
}

function isActiveBill(bill){
    return bill && bill.deleted !== true && bill.isDeleted !== true;
}

function isSameLocalDay(firstDate, secondDate){
    return firstDate.getFullYear() === secondDate.getFullYear() && firstDate.getMonth() === secondDate.getMonth() && firstDate.getDate() === secondDate.getDate();
}

function getWeekStart(date){
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const weekday = start.getDay();
    start.setDate(start.getDate() - (weekday === 0 ? 6 : weekday - 1));
    return start;
}

function getBillsForPeriod(period, referenceDate){
    const reference = referenceDate instanceof Date ? referenceDate : new Date();
    const weekStart = getWeekStart(reference);
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7);

    return billHistory.filter(function(bill){
        if(!isActiveBill(bill)) return false;
        const billDate = parseSavedBillDate(bill.date);
        if(!billDate) return false;
        if(period === "weekly") return billDate >= weekStart && billDate < weekEnd;
        if(period === "monthly") return billDate.getFullYear() === reference.getFullYear() && billDate.getMonth() === reference.getMonth();
        if(period === "yearly") return billDate.getFullYear() === reference.getFullYear();
        return isSameLocalDay(billDate, reference);
    });
}

function getAllReportBills(){

    return billHistory.filter(function(bill){
        return isActiveBill(bill) && Boolean(parseSavedBillDate(bill.date));
    });

}

function parseDateInput(value){
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(!match) return null;

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

    return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
}

function getBillsForDateRange(fromDate, toDate){
    const start = fromDate instanceof Date ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()) : null;
    const end = toDate instanceof Date ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1) : null;

    if(!start || !end || start >= end) return [];

    return billHistory.filter(function(bill){
        if(!isActiveBill(bill)) return false;
        const billDate = parseSavedBillDate(bill.date);
        return billDate && billDate >= start && billDate < end;
    });
}

function getBillSubtotal(bill){
    if(Number.isFinite(Number(bill.subtotal))) return Number(bill.subtotal);
    return (bill.items || []).reduce(function(total, item){
        return total + toNumber(item.total || (toNumber(item.price) * toNumber(item.qty)));
    }, 0);
}

function getBillGST(bill){
    if(Number.isFinite(Number(bill.gst))) return Number(bill.gst);
    return (bill.items || []).reduce(function(total, item){
        return total + (toNumber(item.total || (toNumber(item.price) * toNumber(item.qty))) * toNumber(item.gst) / 100);
    }, 0);
}

function getBillDiscount(bill, subtotal){
    if(Number.isFinite(Number(bill.discount))) return Number(bill.discount);
    return subtotal * toNumber(bill.discountPercent) / 100;
}

function getBillTotal(bill, subtotal, gst, discount, parcelCharge){
    if(Number.isFinite(Number(bill.total))) return Number(bill.total);
    return subtotal + gst - discount + parcelCharge;
}

function calculateSalesSummary(bills){
    const summary = { totalSales: 0, totalBills: 0, subtotal: 0, gst: 0, discounts: 0, parcelCharges: 0, profit: 0 };

    bills.forEach(function(bill){
        const subtotal = getBillSubtotal(bill);
        const gst = getBillGST(bill);
        const discount = getBillDiscount(bill, subtotal);
        const parcelCharge = toNumber(bill.parcelCharge);
        const discountRate = subtotal > 0 ? discount / subtotal : 0;

        summary.totalBills++;
        summary.subtotal += subtotal;
        summary.gst += gst;
        summary.discounts += discount;
        summary.parcelCharges += parcelCharge;
        summary.totalSales += getBillTotal(bill, subtotal, gst, discount, parcelCharge);

        (bill.items || []).forEach(function(item){
            if(item.cost === undefined || item.cost === null || item.cost === "") return;

            const quantity = toNumber(item.qty);
            const sellingAmount = toNumber(item.total || (toNumber(item.price) * quantity));
            const costAmount = toNumber(item.cost) * quantity;

            /* Bill discounts reduce actual selling value. GST and parcel
               charges remain separate report fields and never become profit. */
            summary.profit += (sellingAmount * (1 - discountRate)) - costAmount;
        });
    });

    return summary;
}

function getPeriodLabel(period, referenceDate){
    const reference = referenceDate instanceof Date ? referenceDate : new Date();
    const dateFormat = { day: "numeric", month: "short", year: "numeric" };
    if(period === "weekly"){
        const weekStart = getWeekStart(reference);
        const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
        return weekStart.toLocaleDateString(undefined, dateFormat) + " – " + weekEnd.toLocaleDateString(undefined, dateFormat);
    }
    if(period === "monthly") return reference.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    if(period === "yearly") return String(reference.getFullYear());
    return reference.toLocaleDateString(undefined, dateFormat);
}

function getDateRangeLabel(fromDate, toDate){
    const dateFormat = { day: "numeric", month: "short", year: "numeric" };
    return fromDate.toLocaleDateString(undefined, dateFormat) + " – " + toDate.toLocaleDateString(undefined, dateFormat);
}

function formatCurrency(value){ return "₹" + toNumber(value).toFixed(2); }

function getReportDateKey(date){

    const localDate = date || new Date();

    return localDate.getFullYear() + "-" +
        String(localDate.getMonth() + 1).padStart(2, "0") + "-" +
        String(localDate.getDate()).padStart(2, "0");

}

function getTodaySalesSummary(){ return calculateSalesSummary(getBillsForPeriod("daily")); }

/* Kept for the existing dashboard template; all values use the same summary. */
function getTotalSales(){ return getTodaySalesSummary().totalSales; }

function getTotalProfit(){ return getTodaySalesSummary().profit; }

function showReports(){

    selectedReportPeriod = "all";
    loadBills(renderSalesReport);

}

function updateSalesReport(period){
    selectedReportPeriod = period;
    renderSalesReport();
}

function generateCustomSalesReport(){
    const fromValue = document.getElementById("report-from-date").value;
    const toValue = document.getElementById("report-to-date").value;
    const fromDate = parseDateInput(fromValue);
    const toDate = parseDateInput(toValue);

    customReportRange = { from: fromValue, to: toValue, error: "" };

    if(!fromDate || !toDate){
        customReportRange.error = "Choose both a From date and a To date.";
    }else if(fromDate > toDate){
        customReportRange.error = "From date cannot be after To date.";
    }

    renderSalesReport();
}

function getSelectedReportBills(referenceDate){

    const reference = referenceDate instanceof Date ? referenceDate : new Date();
    const customFromDate = parseDateInput(customReportRange.from);
    const customToDate = parseDateInput(customReportRange.to);

    if(selectedReportPeriod === "all") return getAllReportBills();
    if(selectedReportPeriod === "custom"){
        return customFromDate && customToDate && customFromDate <= customToDate
            ? getBillsForDateRange(customFromDate, customToDate)
            : [];
    }

    return getBillsForPeriod(selectedReportPeriod, reference);

}

function getBillProfit(bill){

    return calculateSalesSummary([bill]).profit;

}

function renderReportBillRows(bills){

    if(bills.length === 0){
        return `<tr><td colspan="9">No bills found for this period.</td></tr>`;
    }

    return bills.map(function(bill){
        const subtotal = getBillSubtotal(bill);
        const gst = getBillGST(bill);
        const discount = getBillDiscount(bill, subtotal);
        const parcelCharge = toNumber(bill.parcelCharge);
        const total = getBillTotal(bill, subtotal, gst, discount, parcelCharge);

        return `<tr>
            <td>${bill.date || "-"}</td>
            <td>${bill.billNo || "-"}</td>
            <td>${Number.isInteger(Number(bill.orderNo)) ? String(bill.orderNo).padStart(3, "0") : "-"}</td>
            <td>${formatCurrency(subtotal)}</td>
            <td>${formatCurrency(gst)}</td>
            <td>${formatCurrency(discount)}</td>
            <td>${formatCurrency(parcelCharge)}</td>
            <td>${formatCurrency(total)}</td>
            <td>${formatCurrency(getBillProfit(bill))}</td>
        </tr>`;
    }).join("");

}

function renderSalesReport(){
    const customFromDate = parseDateInput(customReportRange.from);
    const customToDate = parseDateInput(customReportRange.to);
    const isValidCustomRange = selectedReportPeriod === "custom" && customFromDate && customToDate && customFromDate <= customToDate;
    const reportBills = getSelectedReportBills();
    const summary = calculateSalesSummary(reportBills);
    const periodLabel = selectedReportPeriod === "custom"
        ? (isValidCustomRange ? getDateRangeLabel(customFromDate, customToDate) : "Custom Date Range")
        : (selectedReportPeriod === "all" ? "All Saved Bills" : getPeriodLabel(selectedReportPeriod));
    const customRangeControls = selectedReportPeriod === "custom" ? `
            <div style="margin-top:16px;">
                <label for="report-from-date">From</label><br>
                <input id="report-from-date" type="date" value="${customReportRange.from}"><br><br>
                <label for="report-to-date">To</label><br>
                <input id="report-to-date" type="date" value="${customReportRange.to}"><br><br>
                <button type="button" onclick="generateCustomSalesReport()">Generate Report</button>
                ${customReportRange.error ? `<p role="alert">${customReportRange.error}</p>` : ""}
            </div>` : "";

    content.innerHTML = `
        <div class="page-title">
            <h1>Sales Report</h1>
            <p>${periodLabel}</p>
        </div>
        <div class="card" style="margin-bottom:20px;">
            <label for="report-period"><strong>Report Period</strong></label><br><br>
            <select id="report-period" onchange="updateSalesReport(this.value)">
                <option value="all" ${selectedReportPeriod === "all" ? "selected" : ""}>All</option>
                <option value="daily" ${selectedReportPeriod === "daily" ? "selected" : ""}>Daily</option>
                <option value="weekly" ${selectedReportPeriod === "weekly" ? "selected" : ""}>Weekly</option>
                <option value="monthly" ${selectedReportPeriod === "monthly" ? "selected" : ""}>Monthly</option>
                <option value="yearly" ${selectedReportPeriod === "yearly" ? "selected" : ""}>Yearly</option>
                <option value="custom" ${selectedReportPeriod === "custom" ? "selected" : ""}>Custom Date Range</option>
            </select>
            <button style="margin-left:12px;" onclick="exportSalesCSV()">Export Sales (CSV)</button>
            ${customRangeControls}
        </div>
        <div class="dashboard-grid">
            <div class="card"><h3>Total Sales</h3><h2>${formatCurrency(summary.totalSales)}</h2></div>
            <div class="card"><h3>Total Bills</h3><h2>${summary.totalBills}</h2></div>
            <div class="card"><h3>Subtotal</h3><h2>${formatCurrency(summary.subtotal)}</h2></div>
            <div class="card"><h3>GST</h3><h2>${formatCurrency(summary.gst)}</h2></div>
            <div class="card"><h3>Discounts</h3><h2>${formatCurrency(summary.discounts)}</h2></div>
            <div class="card"><h3>Parcel Charges</h3><h2>${formatCurrency(summary.parcelCharges)}</h2></div>
            <div class="card"><h3>Profit</h3><h2>${formatCurrency(summary.profit)}</h2></div>
        </div>
        <div class="card" style="margin-top:20px;overflow-x:auto;">
            <h2>Detailed Bills</h2>
            <br>
            <table class="bill-table">
                <tr>
                    <th>Date</th><th>Bill / Invoice No.</th><th>Order No.</th><th>Subtotal</th><th>GST</th><th>Discount</th><th>Parcel / Packing Charge</th><th>Grand Total</th><th>Profit</th>
                </tr>
                ${renderReportBillRows(reportBills)}
            </table>
        </div>`;
}

function exportSalesCSV(){
    const today = new Date();
    const isCustomRange = selectedReportPeriod === "custom";
    const exportedBills = getSelectedReportBills(today);
    const summary = calculateSalesSummary(exportedBills);
    let reportType = selectedReportPeriod.charAt(0).toUpperCase() + selectedReportPeriod.slice(1);
    let from = "";
    let to = "";
    let fileDate = getReportDateKey(today);

    if(selectedReportPeriod === "all"){
        reportType = "All";
    }else if(isCustomRange){
        reportType = "Custom";
        from = customReportRange.from;
        to = customReportRange.to;
        fileDate = from + "-to-" + to;
    }else if(selectedReportPeriod === "weekly"){
        const weekStart = getWeekStart(today);
        const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
        from = getReportDateKey(weekStart);
        to = getReportDateKey(weekEnd);
        fileDate = from + "-to-" + to;
    }else if(selectedReportPeriod === "monthly"){
        from = getReportDateKey(today).slice(0, 7);
        fileDate = from;
    }else if(selectedReportPeriod === "yearly"){
        from = String(today.getFullYear());
        fileDate = from;
    }else{
        from = fileDate;
    }

    let csv = "Business Name," + JSON.stringify(settings.cafeName || "Business") + "\n" +
        "Report Type," + reportType + "\n" +
        "From," + from + "\n" +
        "To," + to + "\n" +
        "Generated," + new Date().toLocaleString() + "\n\n" +
        "Total Sales," + summary.totalSales.toFixed(2) + "\n" +
        "Bills," + summary.totalBills + "\n" +
        "Subtotal," + summary.subtotal.toFixed(2) + "\n" +
        "GST," + summary.gst.toFixed(2) + "\n" +
        "Discounts," + summary.discounts.toFixed(2) + "\n" +
        "Parcel/Packing Charges," + summary.parcelCharges.toFixed(2) + "\n" +
        "Profit," + summary.profit.toFixed(2) + "\n\n" +
        "Date,Bill/Invoice No.,Order No.,Subtotal,GST,Discount,Parcel/Packing Charge,Grand Total,Profit\n";
    exportedBills.forEach(function(bill){
        const subtotal = getBillSubtotal(bill);
        const gst = getBillGST(bill);
        const discount = getBillDiscount(bill, subtotal);
        const parcelCharge = toNumber(bill.parcelCharge);
        const total = getBillTotal(bill, subtotal, gst, discount, parcelCharge);

        csv += [
            `"${bill.date || ""}"`,
            `"${bill.billNo || ""}"`,
            `"${Number.isInteger(Number(bill.orderNo)) ? String(bill.orderNo).padStart(3, "0") : ""}"`,
            subtotal.toFixed(2),
            gst.toFixed(2),
            discount.toFixed(2),
            parcelCharge.toFixed(2),
            total.toFixed(2),
            getBillProfit(bill).toFixed(2)
        ].join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `POS-Lite-${reportType}-${sanitizeBackupFileName(settings.cafeName)}-${fileDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
