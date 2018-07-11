// TwitterとHTTP(s)通信を使うよと宣言
var twitter = require('twitter');
var request = require('request');

// Twitterを使うにあたっての初期設定
// 各種情報はTwitterの開発者向けてアカウントを取得するとわかります
var client = new twitter({
  consumer_key: '<your_consumer_key>',
  consumer_secret: '<your_consumer_secret>',
  access_token_key: '<your_access_token_key>',
  access_token_secret: '<your_access_token_secret>'
});

// 発声したかどうか判定用の設定。指定値はなんでも良い
var alreadySpeaking = "hogehuga";

// Twitter の Streaming API を使う設定。follow の値は緊急地震速報BotさんのID
client.stream('statuses/filter', { follow: '214358709' },
  function(stream) {
    stream.on('data', function(tweet) {
      console.log(tweet.text);

      // 緊急地震速報CSVをカンマ毎に切って、取得
      var eqInfo = (tweet.text).split(",");
      console.log(eqInfo);

      // 各カラムの情報(使うもののみ抜粋)
      //eqInfp[0]〜[14]
      // 0: 35=最大震度のみ、36,37=最大震度に加えマグニチュードも、39=キャンセル
      // 1: 00=通情報、01=訓練
      // 3: 0=通常、7=誤キャンセル、8,9=最終報
      // 4: 1〜99。
      // 5: 地震ID
      // 9: 震央の地名
      // 11: マグニチュード
      // 12: 最大震度
      // 14: 警報の有無 0は予報。1は警報

      // 取得したCSVの1番目と0番目の値を確認に指定値であれば処理する
      if (eqInfo[1] == '00' && eqInfo[0] == 37) {

        // CSV の12番目(実際には13番目)から震度の取得する
        var maxIntensity = eqInfo[12];

        // 震度5未満の場合は後続の処理はしない
        if (maxIntensity != 0 && maxIntensity != 1 && maxIntensity != 2 && maxIntensity != 3 && maxIntensity != 4) {

          // 震央(地域)の取得する
          var iEpiCenter = eqInfo[9];

          //指定した震央が含まれる場合にのみ処理を実施する。例は関東東北
          if (iEpiCenter.match(/神奈川*|相模湾*|東京*|千葉*|埼玉*|茨城*|栃木*|群馬*|山梨*|富士山*|長野*|静岡*|伊豆*|駿河*|福島*|三陸沖*|関東*|岩手*|宮城*|青森*|房総半島*|新島*|三宅島*|八丈島*/)) {

            // 対象の場合の発話内容を組み立てる
            var eqMsg = "緊急地震速報。"+ iEpiCenter + "周辺で、最大震度　" + maxIntensity + " の地震が発生する恐れがあります。";
            eqMsg = eqMsg + "速やかに、机の下や、トイレなどの安全な場所に避難してください。";
            eqMsg = eqMsg + "無理にコンロなどの火を消さず、速やかに頭や身体を守ってください。";

            // 対象なので google-home-notifier へ送信し、発声させる
            var options = {
              url: "http://localhost:8091/google-home-notifier/",
              headers: {
                "Content-type": "application/x-www-form-urlencoded"
              },
              form: {
                "text": eqMsg
              }
            };

            // 速報は精度を上げて複数回届くので、既に発声したものかどうかの確認
            if (eqInfo[5] != alreadySpeaking) {
              request.post(options, function(error, response, body) {});
              alreadySpeaking = eqInfo[5];
            }
          }
        }
      }
    });
  }
)
