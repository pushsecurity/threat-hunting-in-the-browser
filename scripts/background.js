//#region DATA_REPORTING
// Data reporting
async function logEvent(data, takeScreenshot) {
    if (takeScreenshot) {
        chrome.tabs.captureVisibleTab(null, {}, function (image) {
            data["screenshot"] = image;
            console.log(data);
        });
    } else {
        console.log(data);
    }
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "logEvent" && request.data) {
    logEvent(request.data, request.takeScreenshot);
  }
});
//#endregion

//#region DOWNLOAD_MONITORING
chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state && delta.state.current === 'complete') {
    chrome.downloads.search({ id: delta.id }, (items) => {
      if (items.length > 0) {
        logEvent({
            event: "File download",
            hostname: new URL(items[0].referrer).hostname,
            href: items[0].referrer,
            filename: items[0].filename,
        }, true);
      }
    });
  }
});
//#endregion

//#region PERIODIC_CHECKS
// Set up a periodic alarm
chrome.runtime.onInstalled.addListener(() => {
  console.log("Installing alarm");
  console.log("Running initial periodic check");
  runPeriodicCheck();
  chrome.alarms.create('periodicCheck', { periodInMinutes: 1 }); 
});

// Listener for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicCheck') {
    runPeriodicCheck();
  }
});

// Function to run the periodic checks
function runPeriodicCheck() {
  fetchApiTokens();
  enumerateExtensions();
}

//#endregion

//#region SHORTCUT_API_SCRAPER
async function fetchApiTokens() {
    const url = "https://app.shortcut.com/backend/api/private/tokens";
    const headers = {
      "tenant-workspace2": "<PLACE_HOLDER_FOR_YOUR_WORKSAPCE_ID>"
    };
  
    try {
      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        credentials: "include",
        headers: headers,
      });
  
      // Check if the response is OK (status code 200–299)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      // Parse the JSON response
      const tokens = await response.json();
  
      // Check if the tokens list is empty
      if (tokens.length === 0) {
        console.log("No shortcut tokens available.");
        return;
      }
  
      // Log each token in a nice format
      tokens.forEach((token, index) => {
        logEvent({
            event: "Shortcut API token",
            hostname: "app.shortcut.com",
            tokenId: token.id,
            tokenDescription: token.description,
            tokenCreated: new Date(token.created_at).toLocaleString(),
            tokenLastUsed: token.last_used ? new Date(token.last_used).toLocaleString() : "Never used"
        }, false);
      });
    } catch (error) {
      console.error("Error fetching shortcut API tokens:", error);
    }
  }
//#endregion

//#region EXTENSION_ENUMERATION
function enumerateExtensions() {
    chrome.management.getAll((extensions) => {
      extensions.forEach((extension) => {
        logEvent({
            "type": "Browser extension",
            "extensionId": extension.id, 
            "extensionName": extension.name,
            "extensionEnabled": extension.enabled,
            "extensionVersion": extension.version,
            "extensionDescription": extension.description,
            "extensionInstallType": extension.installType
        });
      });
    });
}
//#endregion