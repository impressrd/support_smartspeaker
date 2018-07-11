var targetSheet = SpreadsheetApp.getActiveSheet();
var col = 1;
var format = "yyyy/M/d HH:mm";
var timeZone = "Asia/Tokyo";

function recordDateTime() {
  var lastrow = targetSheet.getLastRow();
  if (targetSheet.getRange(lastrow, col).getValue() == "") 
    targetSheet.getRange(lastrow, col).setValue(Utilities.formatDate(new Date(), timeZone,format));
    
   UrlFetchApp.fetch(url, options);
}


