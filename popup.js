// popup.js

document.addEventListener('DOMContentLoaded', function() {
    const inputBox_spreadsheetId = document.getElementById('inputBox_spreadsheetId');
    const inputBox_sheetName = document.getElementById('inputBox_sheetName');
    const checkbox_autoCloseTabs = document.getElementById('checkbox_autoCloseTabs');

    // Load the saved value
    chrome.storage.local.get(
        ['saved_spreadsheetId', 'saved_sheetName', 'saved_autoCloseTabs'], 
        function(result) {
            if (result.saved_spreadsheetId) {
                inputBox_spreadsheetId.value = result.saved_spreadsheetId;
            }
            if (result.saved_sheetName) {
                inputBox_sheetName.value = result.saved_sheetName;
            }
            if (result.saved_autoCloseTabs) {
                checkbox_autoCloseTabs.checked = result.saved_autoCloseTabs;
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