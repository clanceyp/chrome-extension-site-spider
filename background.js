
function run(currentTab) {
    chrome.scripting.executeScript({
        files : [ "inject-script.js" ],
        target: {
            tabId: currentTab.id
        }
    });
    chrome.scripting.insertCSS({
        files : [ "inject-css.css" ],
        target: {
            tabId: currentTab.id
        }
    });
}

chrome.action.onClicked.addListener(run);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.type === "settings-request") {
            chrome.storage.local.get("settings").then(settings => {
                sendResponse({ "foo": settings } );
            });

        }
    }
);