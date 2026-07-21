/* ==========================================
   Reports
========================================== */

function showReports(){

    let totalSales = 0;
    let totalBills = billHistory.length;
    let totalGST = 0;
    let totalProfit = 0;

    billHistory.forEach(function(bill){

        totalSales += bill.total;

        bill.items.forEach(function(item){

            totalGST += (item.total * item.gst) / 100;

            totalProfit +=
                (item.price - Number(findCost(item.name))) * item.qty;

        });

    });

    content.innerHTML = `

        <div class="page-title">

            <h1>Reports</h1>

            <p>Business Summary</p>

        </div>

        <div class="dashboard-grid">

            <div class="card">

                <h3>Total Sales</h3>

                <h2>₹${totalSales.toFixed(2)}</h2>

            </div>

            <div class="card">

                <h3>Total Bills</h3>

                <h2>${totalBills}</h2>

            </div>

            <div class="card">

                <h3>GST Collected</h3>

                <h2>₹${totalGST.toFixed(2)}</h2>

            </div>

            <div class="card">

                <h3>Estimated Profit</h3>

                <h2>₹${totalProfit.toFixed(2)}</h2>

            </div>

        </div>

    `;

}


/* ==========================================
   Dashboard Helpers
========================================== */

function getTotalSales(){

    let total = 0;

    billHistory.forEach(function(bill){

        total += bill.total;

    });

    return total;

}

function getTotalProfit(){

    let profit = 0;

    billHistory.forEach(function(bill){

        bill.items.forEach(function(item){

            if(item.cost !== undefined){

                profit +=
                    (Number(item.price) - Number(item.cost))
                    * Number(item.qty);

            }

        });

    });

    return profit;

}

/* ==========================================
   Dashboard Helpers
========================================== */

function getTotalBills(){

    return billHistory.length;

}

function getTotalSales(){

    let sales = 0;

    billHistory.forEach(function(bill){

        sales += Number(bill.total);

    });

    return sales;

}