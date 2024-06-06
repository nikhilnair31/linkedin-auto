// popup.js

document.addEventListener('DOMContentLoaded', function() {
    const inputBox_spreadsheetId = document.getElementById('inputBox_spreadsheetId');
    const inputBox_sheetName = document.getElementById('inputBox_sheetName');
    const inputBox_uniqueId = document.getElementById('inputBox_uniqueId');
    const checkbox_autoCloseTabs = document.getElementById('checkbox_autoCloseTabs');

    // Load the saved value
    chrome.storage.local.get(
        ['saved_spreadsheetId', 'saved_sheetName', 'saved_uniqueId', 'saved_sentConnReq'], 
        function(result) {
            if (result.saved_spreadsheetId) {
                inputBox_spreadsheetId.value = result.saved_spreadsheetId;
            }
            if (result.saved_sheetName) {
                inputBox_sheetName.value = result.saved_sheetName;
            }
            if (result.saved_uniqueId) {
                inputBox_uniqueId.value = result.saved_uniqueId;
            }
            if (result.saved_sentConnReq) {
                checkbox_sentConnReq.checked = result.saved_sentConnReq;
            }
        }
    );

    // Save the value when user enters text
    inputBox_spreadsheetId.addEventListener('input', function() {
        const text = inputBox_spreadsheetId.value;
        chrome.storage.local.set({ saved_spreadsheetId: text });
    });
    inputBox_sheetName.addEventListener('input', function() {
        const text = inputBox_sheetName.value;
        chrome.storage.local.set({ saved_sheetName: text });
    });
    inputBox_uniqueId.addEventListener('input', function() {
        const text = inputBox_uniqueId.value;
        chrome.storage.local.set({ saved_uniqueId: text });
    });
    checkbox_autoCloseTabs.addEventListener('change', function() {
        const isChecked = checkbox_autoCloseTabs.checked;
        chrome.storage.local.set({ saved_autoCloseTabs: isChecked });
    });
});

// Button Listeners
document.getElementById("startButton").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "startAutomation" });
    });
});
document.getElementById("insertButton").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "insertData", sentReq: false });
    });
});
document.getElementById("updateStatusButton").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "updateStatus" });
    });
});