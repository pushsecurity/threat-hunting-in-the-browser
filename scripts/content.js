console.log("Hello (content script) world!");

//#region WEAK_PASSWORDS
// Global list of bad passwords
const badPasswords = ['password', '123456', '123456789', 'qwerty', 'letmein', 'password1']; // Add more as needed

// Function to create and display a warning box
function showWarningBox(passwordInput) {
  // Check if a warning box already exists, if not, create one
  let existingWarning = document.getElementById('weak-password-warning');
  if (!existingWarning) {
    // Create a new div for the warning box
    const warningBox = document.createElement('div');
    warningBox.id = 'weak-password-warning';
    warningBox.textContent = 'Weak password! Please choose a stronger one.';
    
    // Apply some styles to make the warning box visible and positioned
    warningBox.style.position = 'absolute';
    warningBox.style.backgroundColor = 'red';
    warningBox.style.color = 'white';
    warningBox.style.padding = '5px';
    warningBox.style.borderRadius = '3px';
    warningBox.style.fontSize = '12px';
    warningBox.style.zIndex = '1000'; // Ensure it's on top of other elements

    // Position the warning box relative to the password input field
    const rect = passwordInput.getBoundingClientRect();
    warningBox.style.left = `${rect.right + 10}px`; // Position 10px to the right
    warningBox.style.top = `${rect.top}px`; // Align with the top of the input field

    // Append the warning box to the document body
    document.body.appendChild(warningBox);
  }
}

// Function to remove the warning box
function hideWarningBox() {
  const existingWarning = document.getElementById('weak-password-warning');
  if (existingWarning) {
    existingWarning.remove();
  }
}

// Helper function to check if the password is in the bad passwords list
function isBadPassword(password) {
  return badPasswords.includes(password);
}

// Monitor all password input fields for changes
document.querySelectorAll('input[type="password"]').forEach((passwordInput) => {
  passwordInput.addEventListener('input', function () {
    if (isBadPassword(passwordInput.value)) {
      showWarningBox(passwordInput);
      logEvent({
        "event": "Weak password entered",
      }, false);
    } else {
      hideWarningBox();
    }
  });
});
//#endregion

//#region LINK_LOGGING
// Function to log all observed clickable links on the page
function logAllLinks() {
  const links = document.querySelectorAll('a[href]');
  links.forEach((link) => {
    console.log('Observed link:', link.href);
    logEvent({
        "event": "Link observed",
        "link": link.href
    }, true);
  });
}

// Function to log clicked links
function logClickedLink(event) {
  console.log('Clicked link:', event.target.href);
  logEvent({
    "event": "Link clicked",
    "link": event.target.href
});
}

// Log all observed clickable links when the script runs
logAllLinks();

// Add event listeners to all observed links to log clicks
document.querySelectorAll('a[href]').forEach((link) => {
  link.addEventListener('click', logClickedLink);
});

// Observe dynamically added links and log them as well
const observer = new MutationObserver((mutationsList) => {
  for (let mutation of mutationsList) {
    if (mutation.type === 'childList') {
      // Check added nodes for new links
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'A' && node.href) {
          console.log('Observed new link:', node.href);
          node.addEventListener('click', logClickedLink);
        }

        // In case the added node is a container, check its child links
        if (node.querySelectorAll) {
          const newLinks = node.querySelectorAll('a[href]');
          newLinks.forEach((link) => {
            console.log('Observed new link:', link.href);
            link.addEventListener('click', logClickedLink);
          });
        }
      });
    }
  }
});

// Start observing the document for added nodes (e.g., dynamic content)
observer.observe(document.body, { childList: true, subtree: true });
//#endregion

//#region DATA_REPORTING
async function logEvent(data, takeScreenshot=false) {
    data["hostname"] = window.location.hostname;
    data["href"] = window.location.href.split('?')[0];
    data["full_href"] = window.location.href;
    data["referrer"] = document.referrer;

    chrome.runtime.sendMessage({ action: "logEvent", data: data, takeScreenshot: takeScreenshot });
}
//#endregion
