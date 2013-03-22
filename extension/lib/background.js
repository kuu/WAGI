chrome.extension.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (message) {
        //Request a tab for sending needed information
        chrome.tabs.query({
            "status": "complete",
            "currentWindow": true,
            "windowType": "normal",
            "active": true,
            "highlighted": true
        }, function (tabs) {
            for (tab in tabs) {
                //Sending Message to content scripts
                //console.log('[Background page] sendMessage from the devtools.', message);
                chrome.tabs.sendMessage(tabs[tab].id, message);
            }
        });
    });

    //Posting back to Devtools
    chrome.extension.onMessage.addListener(function (message, sender) {
        if (message.from !== 'webpage') return;
        //console.log('[Background page] postMessage from the web page.', message);
        port.postMessage(message);
    });
});
