// background.js

chrome.runtime.onInstalled.addListener(() => {
    console.log("LinkedIn Automation extension installed.");
});

chrome.commands.onCommand.addListener((command) => {
    console.log(`chrome.commands.onCommand: ${command}`);

    if (command === "start-automation-cmd") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "startAutomation" });
        });
    }
    if (command === "start-insert-cmd") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "insertData" });
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`chrome.runtime.onMessage: ${message.action}`);
    
    if (message.action === 'insertData') {
        insertData(message.spreadsheetId, message.sheetName, message.data)
        .then(response => sendResponse({ status: 'success', response }))
        .catch(error => sendResponse({ status: 'error', error: error.message }));
        return true; // Keep the message channel open for sendResponse
    }
    if (message.action === "closeTab") {
        chrome.tabs.remove(sender.tab.id);
    }
});

async function insertData(spreadsheetId, sheetName, data) {
    console.log("insertData");
    console.log("spreadsheetId: ", spreadsheetId);
    console.log("sheetName: ", sheetName);
    console.log("data: ", data);
    
    try {
        const token = await getAuthToken();
        // console.log("token: ", token);
        if (!token) {
            throw new Error('Failed to obtain OAuth token');
        }
        
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`,
            {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch sheet data: ${response.status} - ${response.statusText} - ${errorText}`);
        }

        const res = await response.json();
        console.log("res: ", res);
        
        const rowLength = res.values ? res.values.length : 0;
        const range = `'${sheetName}'!A${rowLength + 1}`;
        const updateResponse = await fetch(
            encodeURI(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`),
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ values: data }),
            }
        );

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Failed to update sheet data: ${updateResponse.status} - ${updateResponse.statusText} - ${errorText}`);
        }

        const result = await updateResponse.json();
        console.log("Update result: ", result);

        return result;
    } 
    catch (error) {
        console.error('Error in insertData function:', error);
        throw error;
    }
}

function getAuthToken() {
    console.log("getAuthToken");
    
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
                reject(chrome.runtime.lastError);
                return;
            }
            resolve(token);
        });
    });
}