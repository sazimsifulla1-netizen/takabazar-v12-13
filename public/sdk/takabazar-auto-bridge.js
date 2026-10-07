window.addEventListener("message", async (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;

    const { action, amount } = data;

    if (action === "DEBIT_WALLET" || action === "BET") {
        console.log(`Bet recorded: ${amount}`);
        if (event.source) {
            event.source.postMessage({
                status: "SUCCESS",
                action: action,
                balance: window.currentUserBalance || 0
            }, "*");
        }
    } 
    else if (action === "CREDIT_WALLET" || action === "WIN") {
        console.log(`Win recorded: ${amount}`);
        if (event.source) {
            event.source.postMessage({
                status: "SUCCESS",
                action: action,
                balance: window.currentUserBalance || 0
            }, "*");
        }
    }
});
