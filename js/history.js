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

    billHistory
    .map(function(bill, index){
        return { bill: bill, index: index };
    })
    .reverse()
    .forEach(function(entry){

        const bill = entry.bill;
        const index = entry.index;

        html += `

            <div class="card" style="margin-top:15px;">

                ${Number.isInteger(Number(bill.orderNo)) ? `<h2>Order #${String(bill.orderNo).padStart(3, "0")}</h2>` : ""}

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

    html += `

        <div class="billing-card" style="display:none;">
            <div id="invoice-container">
                <div id="invoice"></div>
            </div>
        </div>

    `;

    content.innerHTML = html;

}

/* ==========================================
   Saved Invoice Rendering
========================================== */

function renderSavedInvoice(bill){

    const discount = Number(bill.discount) || 0;
    const parcelCharge = Number(bill.parcelCharge) || 0;
    const discountLabel = Number(bill.discountPercent) > 0
        ? `Discount (${bill.discountPercent}%)`
        : "Discount";
    const orderNumberHtml = Number.isInteger(Number(bill.orderNo))
        ? `<div style="text-align:center;font-size:32px;font-weight:bold;line-height:1.05;margin:16px 0;">ORDER<br>${String(bill.orderNo).padStart(3, "0")}</div>`
        : "";

    let html = `

<div class="card invoice">

   <div style="text-align:center;">

    <h1>${settings.cafeName}</h1>

    <p>${settings.address}</p>

    <p>Phone : ${settings.phone}</p>

    <p>GSTIN : ${settings.gstin}</p>

</div>

<hr>

${orderNumberHtml}

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

${discount > 0 ? `<tr>

    <td><strong>${discountLabel}</strong></td>

    <td style="text-align:right;">- ₹${discount.toFixed(2)}</td>

</tr>` : ""}

${parcelCharge > 0 ? `<tr>

    <td><strong>Parcel / Packing Charge</strong></td>

    <td style="text-align:right;">₹${parcelCharge.toFixed(2)}</td>

</tr>` : ""}

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

    printInvoice(render58mmReceipt(bill, settings.printFormat));

}

/* ==========================================
   Shared Invoice Printing
========================================== */

function printInvoice(invoiceHtml){

    const invoice = document.getElementById("invoice");

    if(!invoice){

        return;

    }

    document.getElementById("print-58-stylesheet").disabled = settings.printFormat !== "58mm";
    document.getElementById("print-80-stylesheet").disabled = settings.printFormat !== "80mm";

    invoice.innerHTML = invoiceHtml;

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
