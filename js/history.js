/* ==========================================
   Bill History
========================================== */

let billHistory = [];

function showHistory(){

    loadBills(renderBillHistory);

}

function renderBillHistory(){

    let html = `

        <div class="page-title">

            <h1>Bill History</h1>

            <p>Previous Bills</p>

        </div>

    `;

    billHistory.forEach(function(bill, index){

        html += `

            <div class="card" style="margin-top:15px;">

                <h3>Bill #${bill.billNo}</h3>

                <p>${bill.date}</p>

                <p>Total : ₹${Number(bill.total).toFixed(2)}</p>

                <br><br>

                <button onclick="viewBill(${index})">👁 View</button>

                <button onclick="printOldBill(${index})">🖨 Print</button>

                <button onclick="deleteBill(${index})">🗑 Delete</button>

            </div>

        `;

    });

    content.innerHTML = html;

}

/* ==========================================
   Saved Invoice Rendering
========================================== */

function renderSavedInvoice(bill){

    let html = `

<div class="card invoice">

   <div style="text-align:center;">

    <h1>${settings.cafeName}</h1>

    <p>${settings.address}</p>

    <p>Phone : ${settings.phone}</p>

    <p>GSTIN : ${settings.gstin}</p>

</div>

<hr>

<table class="bill-table">

<tr>

<td><strong>Invoice No</strong></td>

<td>${bill.billNo}</td>

</tr>

<tr>

<td><strong>Date</strong></td>

<td>${bill.date}</td>

</tr>

<tr>

<td><strong>Customer</strong></td>

<td>${bill.customerName}</td>

</tr>

<tr>

<td><strong>Phone</strong></td>

<td>${bill.customerPhone}</td>

</tr>

<tr>

<td><strong>Payment</strong></td>

<td>${bill.paymentMethod}</td>

</tr>

</table>

<br>

<table class="bill-table">

<tr>

<th>Item</th>

<th>Qty</th>

<th>Rate</th>

<th>Amount</th>

</tr>

`;

    bill.items.forEach(function(item){

        html += `

<tr>

<td>${item.name}</td>

<td>${item.qty}</td>

<td>₹${item.price}</td>

<td>₹${item.total}</td>

</tr>

`;

    });

    html += `

</table>

<br>

<table class="bill-table">

<tr>

    <td><strong>Subtotal</strong></td>

    <td style="text-align:right;">

        ₹${Number(bill.subtotal).toFixed(2)}

    </td>

</tr>

<tr>

    <td><strong>GST</strong></td>

    <td style="text-align:right;">

        ₹${Number(bill.gst).toFixed(2)}

    </td>

</tr>

<tr>

    <td><strong>Grand Total</strong></td>

    <td style="text-align:right;">

        <strong>

        ₹${Number(bill.total).toFixed(2)}

        </strong>

    </td>

</tr>

</table>

<br>

<div style="text-align:center;margin-top:25px;">

<hr>

<p><strong>Thank You for Visiting!</strong></p>

<p>We Appreciate Your Business ❤️</p>

<p>Please Visit Again ☕</p>

<br>

<p style="font-size:12px;">

Powered by <strong>MS ZAMA Dynamics</strong>

</p>

</div>

</div>

`;

    return html;

}

function showSavedInvoice(bill){

    content.innerHTML = `

        <div id="invoice-container">

            <div id="invoice" style="margin-top:30px;">

                ${renderSavedInvoice(bill)}

            </div>

        </div>

    `;

}

/* ==========================================
   View and Print Bill
========================================== */

function viewBill(index){

    const bill = billHistory[index];

    if(!bill) return;

    showSavedInvoice(bill);

}

function printOldBill(index){

    const bill = billHistory[index];

    if(!bill) return;

    printInvoice(renderSavedInvoice(bill));

}

/* ==========================================
   Shared Invoice Printing
========================================== */

function printInvoice(invoiceHtml){

    const previousPrintInvoice = document.getElementById("print-invoice");

    if(previousPrintInvoice){

        previousPrintInvoice.remove();

    }

    const printInvoiceElement = document.createElement("div");

    printInvoiceElement.id = "print-invoice";

    printInvoiceElement.innerHTML = invoiceHtml;

    document.body.appendChild(printInvoiceElement);

    window.addEventListener("afterprint", function(){

        printInvoiceElement.remove();

    }, { once:true });

    window.print();

}

/* ==========================================
   Delete Bill
========================================== */

function deleteBill(index){

    const bill = billHistory[index];

    if(!bill) return;

    if(!confirm(`Delete bill ${bill.billNo}? This cannot be undone.`)){

        return;

    }

    deleteBillDB(bill.id, function(){

        billHistory.splice(index, 1);

        renderBillHistory();

    }, function(){

        alert("Unable to delete the bill. Please try again.");

    });

}
