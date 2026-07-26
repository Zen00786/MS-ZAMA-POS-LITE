/* ==========================================
   Settings
========================================== */

let settings = {

    cafeName : "Healthy Cafe",

    invoicePrefix : "HC",

    gstin : "",

    phone : "",

    address : "",

    printFormat : "A4"

};

function showSettings(){

    content.innerHTML = `

        <div class="page-title">

            <h1>Settings</h1>

            <p>Business Information</p>

        </div>

        <div class="card">

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

            <button onclick="exportBackup()">

                Export Backup

            </button>

            <button onclick="document.getElementById('backup-file').click()">

                Import Backup

            </button>

            <input
                id="backup-file"
                type="file"
                accept="application/json,.json"
                onchange="importBackup(event)"
                style="display:none;"
            >

        </div>

    `;

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

    saveSettingsDB(settings, function(){

        alert("Settings Saved");

    });

}

function exportBackup(){

    exportBackupData();

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
