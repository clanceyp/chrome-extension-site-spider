function run(currentTab) {
    // const [currentTab] = await chrome.tabs.query({
    //     active: true,
    //     currentWindow: true
    // });
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

    document.getElementById("message")
        .insertAdjacentHTML("beforeEnd",
        `<a target="_blank" href="${ chrome.runtime.getURL('options.html') }"> OPTIONS PAGE </a>`
    )
}

// run();

chrome.action.onClicked.addListener(run);