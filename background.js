
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
