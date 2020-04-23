function removeEmptyCols(tableID) {
    $(`#${tableID} th`).each(function(i) {
        var remove = 0;
    
        var tds = $(this).parents('table').find('tr td:nth-child(' + (i + 1) + ')')
        tds.each(function(j) { if (this.innerHTML == '') remove++; });
    
        if (remove == ($(`#${tableID} tr`).length - 1)) {
            $(this).hide();
            tds.hide();
        }
    });
}

function downloadTableAsExcel(tableID) {
    let tab_text = [];

    tab_text.push('<html xmlns:x="urn:schemas-microsoft-com:office:excel">');
    tab_text.push('<head><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>');

    tab_text.push('<x:Name>Test Sheet</x:Name>');

    tab_text.push('<x:WorksheetOptions><x:Panes></x:Panes></x:WorksheetOptions></x:ExcelWorksheet>');
    tab_text.push('</x:ExcelWorksheets></x:ExcelWorkbook></xml></head><body>');

    tab_text.push("<table border='1px'>");
    tab_text.push($(`#${tableID}`).html());
    tab_text.push('</table></body></html>');

    var player_type = 'player:application/vnd.ms-excel';
    
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    
    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
        if (window.navigator.msSaveBlob) {
            var blob = new Blob([tab_text], {
                type: "application/csv;charset=utf-8;"
            });
            navigator.msSaveBlob(blob, `${tableID}.xls`);
        }
    } else {
        download(`${tableID}.xls`, tab_text);
    }
}

function createReportTable(header, player, id) {
    var tableID = id.replace(/\s+/g, '_');
    let total = 0;
    var table = $(`<table class='report-table'></table>`);
    table.attr('id', `${tableID}-table`);
    table.appendTo('#tables');

    table = document.getElementById(`${tableID}-table`);

    //Insert Total Spent
    let row = table.insertRow();
    addCell(`Total spent`, row);
    addCell('', row);
    addCell(currencyFormat(parsedList[id].totalSpent), row);

    //Utility Stats
    row = table.insertRow();
    addCell('Utility purchased', row);
    addCell('', row);
    addCell(parsedList[id].utilityPurchased, row);

    row = table.insertRow();
    addCell('Utility thrown', row);
    addCell('', row);
    addCell(parsedList[id].utilityThrew, row);

    row = table.insertRow();
    addCell('Utility ratio', row);
    addCell('', row);
    addCell(parsedList[id].utilityRatio, row);

    row = table.insertRow();
    addCell('Flash ratio', row);
    addCell('', row);
    addCell(parsedList[id].flashRatio, row);

    for(var trigger in player){
        for(var target in player[trigger]){
            if(!trigger.includes("say")){
                let row = table.insertRow();
                if(trigger == 'blinded'){
                    var totalTime = 0;
                    player[trigger][target].forEach(element => {
                        totalTime += element.blindedTime;
                    });
                    addCell(`${trigger} ${target}`, row);
                    addCell(player[trigger][target].length, row);
                    addCell(`${totalTime.toFixed(2)} seconds`, row);
                }else if(trigger == "assisted"){
                    addCell(`${trigger} killing ${target}`, row);
                    addCell(player[trigger][target].length, row);
                    addCell('', row);
                } else {
                    addCell(`${trigger} ${target}`, row);
                    addCell(player[trigger][target].length, row);
                    addCell('', row);
                }
            }
        }
    }

    let thead = table.createTHead();
    row = thead.insertRow();
    for(let key of header){
        let th = document.createElement('th');
        let text = document.createTextNode(key);
        th.appendChild(text);
        row.appendChild(th);
    }

    playerTables[id] = document.getElementById(`${tableID}-table`);
    
    playerTables[id].parentNode.removeChild(playerTables[id]);
}

function addCell(input, row){
    let cell = row.insertCell();
    let text = document.createTextNode(input);
    cell.appendChild(text);
}

function currencyFormat(num) {
    return '$' + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  }