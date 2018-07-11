//Raspberry pi のURLを取得する関数。
function getNgrokUrlBySheet(){
  var ngrokSheetId = "*****"; //スプレッドシートのId
  // 参照するファイルのシート名を指定する
  var ngrokSheet = SpreadsheetApp.openById(ngrokSheetId).getSheetByName("url");
  // 一番左上(A1)のセルに記録されている値を取得する
  var url = ngrokSheet.getRange(1, 1).getValue();  
  return url;
}

//POSTを受けた後の処理。IFTTTやcurlでのテスト時の窓口。
function doPost(e) {
  var milkSheetId = "*****"; //授乳記録シート
  var milkSheet = SpreadsheetApp.openById(milkSheetId).getSheetByName("milk");
  
  var msg = "";

  //IFTTT からのアクセス以外はスルーする
  if (e.parameter.postFrom === 'ifttt') {
      //IFTTTに埋め込んでおく動作関数名を取得
      var doAction = e.parameter.doAction;

      //デバッグ用の設定値
      //var doAction = "lastMilk";
      //var doAction = "toDayMilk";
      //var doAction = "toiletRecord";
      //var doAction = "showTen";
      
       var nowTimeTmp = new Date();
       var nowDateTmp = Utilities.formatDate(nowTimeTmp, 'Asia/Tokyo', "YYYY/M/D");

      switch　(doAction) {
        case 'lastMilk':
          msg=lastMilkTimeAndQua(nowTimeTmp);
          break;
        case 'toDayMilk':
          msg=toDayMilkData(nowDateTmp);
          break;
        case 'messageForHome':
          msg = e.parameter.messageText;
          break;
        case 'toiletRecord':
          msg=toDayToiletRecord(nowDateTmp);
          break;
        case 'showTen':
          msg=toDayShowTen(nowTimeTmp);
          break;
        default:
          break;  
        }
  }
  if (msg != "") {
   postMsg(msg, getNgrokUrlBySheet());
  }
}

//最終授乳時刻と経過時間、量を取得する関数
function lastMilkTimeAndQua(nowTime) {
	var milkSheetId = "****"; //授乳記録シート
	var milkSheet = SpreadsheetApp.openById(milkSheetId).getSheetByName("milk");
	var msg = "";

	var lastRow = milkSheet.getLastRow();
	//最終記録日付があるかをまず確認。
	var lastMilk = milkSheet.getRange(lastRow, 1).getValue();
	if (lastMilk != "日時") {
		//経過時間を算出
		var dstMilSec = nowTime.getTime() - lastMilk;
		var dstTmpMin = Math.floor(dstMilSec / (1000 * 60)); //経過時間全体を分で取得
		if (dstTmpMin > 60 ){ //経過時間全体が60分以上であるか
			var dstHour = Math.floor(dstTmpMin / 60); //x時間を取得
			var distMin = dstTmpMin - (dstHour * 60); //x時間を分に戻して、経過時間全体から減算して分を取得。
			var distLastMilkTime = dstHour + "時間　" + distMin + "分、経過しています。";
		}else{
			var distLastMilkTime = dstTmpMin+"分、経過しています。";
    		}
		var lastMilkTime = Utilities.formatDate(lastMilk, 'Asia/Tokyo', "H時m分");
		var lastMilkQua = milkSheet.getRange(lastRow,2).getValue();
		msg = "最後にミルクを飲んだのは、"+ lastMilkTime +"です。　"+ distLastMilkTime +"量は"+ lastMilkQua +"ミリリットル　でした。";
	} else {
		msg = "授乳の記録がされていません。登録後に再度試してください";
	}
	return msg;
}

//今日の授乳回数、量、平均値を取得する関数
function toDayMilkData(nowDate) {
	var milkSheetId = "****"; //授乳記録シート
	var milkSheet = SpreadsheetApp.openById(milkSheetId).getSheetByName("milk");
	var msg = "";

	//Logger.log(nowDate);
	var dataArray = milkSheet.getDataRange().getValues();
	var nursingTimes = 0;
	var nursingQua = 0;
	for (var i = 2 ; i < dataArray.length; i++) {
		var targetRow = Utilities.formatDate(dataArray[i][0], 'Asia/Tokyo', "YYYY/M/D");
		if (targetRow === nowDate){
			nursingTimes = nursingTimes+1;
			nursingQua = nursingQua + dataArray[i][1];
    		}
  	}
	if (nursingTimes > 0) {
		var nursingQuaAvg = Math.floor(nursingQua / nursingTimes);
		msg = "今日は" + nursingTimes + "回　飲みました。 合計は"+ nursingQua + "ミリリットル、平均は"+nursingQuaAvg+"ミリリットルです";
	} else {
		msg = "今日は記録がありません";
	}
	return msg;
}

//今日のトイレの回数。家と外でそれぞれ何回か。
function toDayToiletRecord(nowDate) {
	var toiletSheetId = "1zNSMtkG_3wbMAnU-8_BsdbODpT9n3g9i1WsyzAwGFH0"; //トイレ記録シート
	var toiletSheet = SpreadsheetApp.openById(toiletSheetId).getSheetByName("toilet");
	var dataArray = toiletSheet.getDataRange().getValues();
	var homeCount = 0;
	var outsideCount = 0;
	var msg = "";
	for (var i = 2 ; i < dataArray.length; i++) {
		var targetRow = Utilities.formatDate(dataArray[i][0], 'Asia/Tokyo', "YYYY/M/D");
		if (targetRow === nowDate){
			homeCount = homeCount + dataArray[i][1];
			outsideCount = outsideCount + dataArray[i][2];
    		}
		var totalCount = homeCount + outsideCount;
	}
	if (totalCount > 0) {
		msg = "今日は、";
		if (homeCount > 0) {
			msg = msg + "おうちで" + homeCount + "回 できました。";
		}
		if (outsideCount > 0) {
			msg = msg + "おそとでは、" + outsideCount + "回 できました。"; 
		}
	} else {
		msg = "今日は記録がありません";
  	}
	return msg;
}

//今日は笑点やるか
function toDayShowTen(nowTime) {
	var dayOfTheWeek = Utilities.formatDate(nowTime, 'Asia/Tokyo', "E");
	var msg = "";
	switch (dayOfTheWeek){
		case 'Sun':
			msg = "今日は日曜日。地上で夕方5時30分からだよ！";
			break;
		case 'Tue':
			msg = "今日は火曜日。火曜懐かし版の日。ビーエスで夜7時からだよ！";
			break;
		case 'Wed':
			msg = "今日は水曜日。水曜懐かし版の日。ビーエスで夜7時からだよ！";
			break;    
		case 'Thu':
			msg = "今日は木曜日。特大号の日。ビーエスで夜9時からだよ！";
			break;
		default:
			msg = "今日はやらないよ〜";
			break;
  	}
	return msg;
}

/* 
* messageをpostする関数
*/
function postMsg(msg, url){
   var payload =
   {
     "text" : msg
   };

   var options =
   {
     "method" : "post",
     "payload" : payload
   };

   UrlFetchApp.fetch(url, options);
}
