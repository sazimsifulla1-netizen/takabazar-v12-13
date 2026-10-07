window.TakaBazarSDK = {
    getBalance: function() {
        window.parent.postMessage({ action: "GET_BALANCE" }, "*");
    },
    sendBet: function(amount) {
        window.parent.postMessage({ action: "BET", amount: amount }, "*");
    },
    sendWin: function(amount) {
        window.parent.postMessage({ action: "WIN", amount: amount }, "*");
    }
};
