/* ==========================================
   Settings
========================================== */

let settings = {

    cafeName : "Healthy Cafe",

    invoicePrefix : "HC",

    gstin : "",

    phone : "",

    address : "",

    printFormat : "A4",

    businessLogo : "",
    licensedTo : "",
    licenseKey : "",
    licenseActivated : false,
    installationId : ""

};

function showSettings(){

    content.innerHTML = `

        <div class="page-title">

            <h1>Settings</h1>

            <p>Business Information</p>

        </div>

        <div class="card">

            <label><strong>Business Logo</strong></label>

            <br><br>

            <div id="business-logo-preview" class="business-logo-preview"></div>

            <input id="business-logo" type="file" accept="image/png,image/jpeg,image/webp">

            <br><br>

            <input id="cafe-name" placeholder="Cafe Name"
            value="${settings.cafeName}">

            <br><br>

            <input id="invoice-prefix"
            placeholder="Invoice Prefix"
            value="${settings.invoicePrefix}">

            <br><br>

            <input id="gstin"
            placeholder="GSTIN"
            value="${settings.gstin}">

            <br><br>

            <input id="phone"
            placeholder="Phone Number"
            value="${settings.phone}">

            <br><br>

            <textarea id="address"
            placeholder="Address">${settings.address}</textarea>

            <br><br>

<label><strong>Print Format</strong></label>

<br><br>

<select id="print-format">

    <option value="A4"
        ${settings.printFormat==="A4"?"selected":""}>
        A4 Invoice
    </option>

    <option value="58mm"
        ${settings.printFormat==="58mm"?"selected":""}>
        58 mm Thermal
    </option>

    <option value="80mm"
        ${settings.printFormat==="80mm"?"selected":""}>
        80 mm Thermal
    </option>

</select>

            <button onclick="saveSettings()">

                Save Settings

            </button>

            <br><br>

            <button id="check-for-updates" type="button" onclick="checkForAppUpdates()">

                Check for Updates

            </button>

            <p id="update-status" role="status" aria-live="polite"></p>

        </div>

        <div class="card">
            <h2>Backup & Restore</h2>
            <br>
            <h3>POS Setup</h3>
            <p>Business settings, products, license/configuration, and counters. Bills are not included.</p>
            <button type="button" onclick="exportPosSetupBackup()">Export POS Setup</button>
            <button type="button" onclick="document.getElementById('pos-setup-backup-file').click()">Import POS Setup</button>
            <input id="pos-setup-backup-file" type="file" accept="application/json,.json" onchange="importPosSetupFile(event)" style="display:none;">
            <hr style="margin:30px 0;">
            <h3>Bills & Reports</h3>
            <p>Exports saved bill records for the selected period. POS settings and products are not included.</p>
            <label for="bills-backup-period">Export Period</label><br><br>
            <select id="bills-backup-period" onchange="toggleBillsBackupRange()">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Date Range</option>
            </select>
            <div id="bills-backup-custom-range" style="display:none;margin-top:16px;">
                <label for="bills-backup-from">From</label><br>
                <input id="bills-backup-from" type="date"><br><br>
                <label for="bills-backup-to">To</label><br>
                <input id="bills-backup-to" type="date">
            </div>
            <br><br>
            <button type="button" onclick="exportBillsReportsFromSettings()">Export Bills & Reports</button>
            <button type="button" onclick="document.getElementById('bills-reports-backup-file').click()">Import Bills & Reports</button>
            <input id="bills-reports-backup-file" type="file" accept="application/json,.json" onchange="importBillsReportsFile(event)" style="display:none;">
        </div>

        <div class="card about-card">

            <h2>About & License</h2>
            <p><strong>POS Lite</strong><br>Version 1.0</p>
            <p>Licensed to:<br><strong>${settings.licensedTo || "Not activated"}</strong></p>
            <p>Developed by:<br><strong>MS ZAMA Dynamics</strong></p>
            <p>License Status:<br><strong>${settings.licenseActivated ? "Activated" : "Not Activated"}</strong></p>
            <p>Installation ID:<br><code>${settings.installationId || "Preparing..."}</code></p>

        </div>

    `;

    renderBusinessLogoPreview();

}

function saveSettings(){

    settings.cafeName =
        document.getElementById("cafe-name").value;

    settings.invoicePrefix =
        document.getElementById("invoice-prefix").value;

    settings.gstin =
        document.getElementById("gstin").value;

    settings.phone =
        document.getElementById("phone").value;

    settings.address =
        document.getElementById("address").value;

    settings.printFormat =
    document.getElementById("print-format").value;

    const logoInput = document.getElementById("business-logo");
    const selectedLogo = logoInput.files[0];

    if(selectedLogo && !["image/png", "image/jpeg", "image/webp"].includes(selectedLogo.type)){

        alert("Please choose a PNG, JPG, or WEBP image.");

        return;

    }

    if(selectedLogo){

        const reader = new FileReader();

        reader.onload = function(){

            settings.businessLogo = reader.result;
            persistSettings();

        };

        reader.onerror = function(){

            alert("Unable to read the selected business logo.");

        };

        reader.readAsDataURL(selectedLogo);

        return;

    }

    persistSettings();

}

function persistSettings(){

    saveSettingsDB(settings, function(){

        updateClientBranding();

        alert("Settings Saved");

    });

}

function renderBusinessLogoPreview(){

    const preview = document.getElementById("business-logo-preview");

    if(settings.businessLogo){

        preview.innerHTML = `<img src="${settings.businessLogo}" alt="Business logo">`;

    }

}

function toggleBillsBackupRange(){

    const period = document.getElementById("bills-backup-period").value;
    document.getElementById("bills-backup-custom-range").style.display = period === "custom" ? "block" : "none";

}

function exportBillsReportsFromSettings(){

    const period = document.getElementById("bills-backup-period").value;

    loadBills(function(){

    const today = new Date();
    let bills;
    let details;

    if(period === "custom"){
        const fromValue = document.getElementById("bills-backup-from").value;
        const toValue = document.getElementById("bills-backup-to").value;
        const fromDate = parseDateInput(fromValue);
        const toDate = parseDateInput(toValue);

        if(!fromDate || !toDate || fromDate > toDate){
            alert("Choose a valid From and To date for Bills & Reports export.");
            return;
        }

        bills = getBillsForDateRange(fromDate, toDate);
        details = { type:"Custom Range", from:fromValue, to:toValue, fileDate:fromValue + "-to-" + toValue };
    }else{
        bills = getBillsForPeriod(period, today);

        if(period === "weekly"){
            const weekStart = getWeekStart(today);
            const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
            details = { type:"Weekly", from:getOrderNumberDateKey(weekStart), to:getOrderNumberDateKey(weekEnd), fileDate:getOrderNumberDateKey(weekStart) + "-to-" + getOrderNumberDateKey(weekEnd) };
        }else if(period === "monthly"){
            details = { type:"Monthly", from:getOrderNumberDateKey(today).slice(0, 7), fileDate:getOrderNumberDateKey(today).slice(0, 7) };
        }else if(period === "yearly"){
            details = { type:"Yearly", from:String(today.getFullYear()), fileDate:String(today.getFullYear()) };
        }else{
            details = { type:"Daily", from:getOrderNumberDateKey(today), fileDate:getOrderNumberDateKey(today) };
        }
    }

    exportBillsReportsBackup(bills, details);

    });

}

function readBackupFile(event, onBackup){

    const file = event.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(){
        try{
            onBackup(JSON.parse(reader.result));
        }catch(error){
            alert("Invalid backup file. Please choose a valid JSON file.");
        }
        event.target.value = "";
    };
    reader.onerror = function(){
        alert("Unable to read the selected backup file.");
        event.target.value = "";
    };
    reader.readAsText(file, "UTF-8");

}

function importPosSetupFile(event){

    readBackupFile(event, function(backup){
        const validation = validatePosSetupBackup(backup);
        if(!validation.valid){ alert(validation.message); return; }
        if(!confirm("Import POS Setup? This will replace current business settings, products, license/configuration, and counters. Bill History will not be changed.")) return;
        importPosSetupBackup(backup, function(){
            alert("POS Setup restored. The app will now reload.");
            window.location.reload();
        }, alert);
    });

}

function importBillsReportsFile(event){

    readBackupFile(event, function(backup){
        const validation = validateBillsReportsBackup(backup);
        if(!validation.valid){ alert(validation.message); return; }
        if(!confirm("Import Bills & Reports? Existing bills will remain. Bills with an existing invoice number will be skipped.")) return;
        importBillsReportsBackup(backup, function(importedCount, skippedCount){
            alert(`Bills & Reports imported: ${importedCount} added, ${skippedCount} skipped.`);
            loadBills();
        }, alert);
    });

}

function exportBackup(){

    exportBackupData();

}

function checkForAppUpdates(){

    const status = document.getElementById("update-status");
    const button = document.getElementById("check-for-updates");

    function setStatus(message){

        if(status){
            status.textContent = message;
        }

    }

    if(!("serviceWorker" in navigator)){

        setStatus("Updates are unavailable in this browser.");

        return;

    }

    setStatus("Checking for updates...");

    if(button){
        button.disabled = true;
    }

    navigator.serviceWorker.getRegistration().then(function(registration){

        if(!registration){

            setStatus("Update service is not ready. Please try again shortly.");

            return;

        }

        let updateFound = false;
        let reloading = false;

        const restartForUpdate = function(){

            if(reloading){
                return;
            }

            reloading = true;
            setStatus("Update found — restarting...");
            window.location.reload();

        };

        const observeWorker = function(worker){

            if(!worker){
                return;
            }

            updateFound = true;
            setStatus("Update found — restarting...");

            if(worker.state === "installed" && navigator.serviceWorker.controller){
                worker.postMessage({ type:"SKIP_WAITING" });
            }

            worker.addEventListener("statechange", function(){

                if(worker.state === "installed" && navigator.serviceWorker.controller){
                    worker.postMessage({ type:"SKIP_WAITING" });
                }

            });

        };

        const updateFoundHandler = function(){

            observeWorker(registration.installing);

        };

        registration.addEventListener("updatefound", updateFoundHandler);
        navigator.serviceWorker.addEventListener("controllerchange", restartForUpdate, { once:true });

        observeWorker(registration.installing || registration.waiting);

        return registration.update().then(function(){

            observeWorker(registration.installing || registration.waiting);

            if(!updateFound){

                registration.removeEventListener("updatefound", updateFoundHandler);
                navigator.serviceWorker.removeEventListener("controllerchange", restartForUpdate);
                setStatus("App is up to date.");

            }

        });

    }).catch(function(){

        setStatus("Unable to check for updates. Please try again.");

    }).finally(function(){

        if(button){
            button.disabled = false;
        }

    });

}

function importBackup(event){

    const file = event.target.files[0];

    if(!file) return;

    const reader = new FileReader();

    reader.onload = function(){

        let backup;

        try{

            backup = JSON.parse(reader.result);

        }
        catch(error){

            alert("Invalid backup file. Please choose a valid JSON backup.");

            event.target.value = "";

            return;

        }

        importBackupData(backup, function(){

            alert("Backup restored successfully. The app will now reload.");

            window.location.reload();

        }, function(message){

            alert(message);

        });

        event.target.value = "";

    };

    reader.onerror = function(){

        alert("Unable to read the selected backup file.");

        event.target.value = "";

    };

    reader.readAsText(file, "UTF-8");

}
