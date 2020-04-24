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

    //Calculate KDA
    let kills = 0;
    let deaths = 0;
    let assists = 0;

    for(var target in player["killed"]){
        kills += player["killed"][target].length;
    }

    for(var target in player["assisted_killing"]){
        assists += player["assisted_killing"][target].length;
    }

    for(var el in parsedList){
        if(parsedList[el]["killed"][id] != undefined){
            deaths += parsedList[el]["killed"][id].length;
        }
    }

    //Insert Manual Rows
    addManual('Total spent', '', currencyFormat(parsedList[id].totalSpent), table);
    addManual(`Kills`, kills,'', table);
    addManual(`Assists`, assists,'', table);
    addManual(`Deaths`, deaths,'', table);
    addManual('Utility purchased', parsedList[id].utilityPurchased,'', table);
    addManual('Utility thrown', parsedList[id].utilityThrew,'', table);
    addManual('Utility ratio','', parsedList[id].utilityRatio, table);
    addManual('Team Flashes', parsedList[id].teamFlashes,'', table);
    addManual('Enemy Flashes', parsedList[id].enemyFlashes,'', table);
    
    weaponTypes.forEach(element => {
        let typeKills = 0;

        let gunType = element.charAt(0).toUpperCase() + element.slice(1);
        if(element == 'smg') gunType = element.toUpperCase();

        if(element != "item"){
            for(var target in player["killed"]){
                player["killed"][target].forEach(event => {
                    let gun = event.gun;
                    if(items[gun].type == element){
                        typeKills++;
                    }
                });
            }

            addManual(`${gunType} kills`, typeKills,'', table);
        }
    });

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

function addManual(input1, input2, input3, table){
    let row = table.insertRow();
    addCell(input1, row);
    addCell(input2, row);
    addCell(input3, row);
}

function currencyFormat(num) {
    return '$' + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  }