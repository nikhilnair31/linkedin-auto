// popup.js

document.addEventListener('DOMContentLoaded', function() {
    const inputBox_spreadsheetId = document.getElementById('inputBox_spreadsheetId');
    const inputBox_sheetName = document.getElementById('inputBox_sheetName');

    // Load the saved value
    chrome.storage.local.get(['saved_spreadsheetId'], function(result) {
        if (result.saved_spreadsheetId) {
            inputBox_spreadsheetId.value = result.saved_spreadsheetId;
        }
    });
    chrome.storage.local.get(['saved_sheetName'], function(result) {
        if (result.saved_sheetName) {
            inputBox_sheetName.value = result.saved_sheetName;
        }
    });

    // Save the value when user enters text
    inputBox_spreadsheetId.addEventListener('input', function() {
        const text = inputBox_spreadsheetId.value;
        chrome.storage.local.set({ saved_spreadsheetId: text });
    });
    inputBox_sheetName.addEventListener('input', function() {
        const text = inputBox_sheetName.value;
        chrome.storage.local.set({ saved_sheetName: text });
    });
});

document.getElementById("startButton").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "startAutomation" });
    });
});

document.getElementById("insertButton").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "insertData" });
    });
});

document.getElementById("updateStatusButton").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "updateStatus" });
    });
});