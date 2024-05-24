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
        // Get token
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Failed to obtain OAuth token');
        }
        
        // Getting sheet details to know row num to insert at
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

        // Check if the name already exists
        const nameExists = res.values.some(row => row[0] === data[0][0]);
        console.log("nameExists: ", nameExists);
        if (nameExists) {
            // Send message to the content script or popup to ask for confirmation
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "confirmDuplicate", name: data[0][0] }, async (response) => {
                    if (response.confirm) {
                        // Continue with the insertion
                        await continueInsert();
                    } else {
                        console.error(`Name "${data[0][0]}" insertion canceled by user.`);
                    }
                });
            });
        } 
        else {
            // No duplicate found, continue with the insertion
            await continueInsert();
        }

        async function continueInsert() {
            const rowLength = res.values ? res.values.length : 0;
            const colLength = res.values[0] ? res.values[0].length : 0;
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

            // Fetch existing conditional formatting rules
            const cfResponse = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(title),conditionalFormats)`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!cfResponse.ok) {
                const errorText = await cfResponse.text();
                throw new Error(`Failed to fetch conditional formatting: ${cfResponse.status} - ${cfResponse.statusText} - ${errorText}`);
            }

            const cfResult = await cfResponse.json();
            console.log("Conditional formatting result: ", cfResult);

            const conditionalFormats = cfResult.sheets.find(s => s.properties.title === sheetName).conditionalFormats || [];
            console.log("conditionalFormats: ", conditionalFormats);

            // Fetch sheet properties to get sheetId
            const sheetPropertiesResponse = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(title,sheetId))`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!sheetPropertiesResponse.ok) {
                const errorText = await sheetPropertiesResponse.text();
                throw new Error(`Failed to fetch sheet properties: ${sheetPropertiesResponse.status} - ${sheetPropertiesResponse.statusText} - ${errorText}`);
            }

            const sheetPropertiesResult = await sheetPropertiesResponse.json();
            const sheet = sheetPropertiesResult.sheets.find(s => s.properties.title === sheetName);
            if (!sheet) {
                throw new Error(`No sheet found with title: ${sheetName}`);
            }
            const sheetId = sheet.properties.sheetId;

            // Clear the existing basic filter
            const clearFilterResponse = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        requests: [
                            {
                                clearBasicFilter: {
                                    sheetId: sheetId
                                },
                            },
                        ],
                    }),
                }
            );

            if (!clearFilterResponse.ok) {
                const errorText = await clearFilterResponse.text();
                throw new Error(`Failed to clear basic filter: ${clearFilterResponse.status} - ${clearFilterResponse.statusText} - ${errorText}`);
            }

            const clearFilterResult = await clearFilterResponse.json();
            console.log("Clear filter result: ", clearFilterResult);

            // Re-enable the basic filter to cover the entire range
            const enableFilterResponse = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        requests: [
                            {
                                setBasicFilter: {
                                    filter: {
                                        range: {
                                            sheetId: sheetId,
                                            startRowIndex: 0,
                                            endRowIndex: rowLength + 1,  // Including the new row
                                            startColumnIndex: 0,
                                            endColumnIndex: colLength,
                                        },
                                    },
                                },
                            },
                            ...conditionalFormats.map(cf => ({
                                addConditionalFormatRule: {
                                    rule: cf,
                                    index: cf.index,
                                },
                            })),
                        ],
                    }),
                }
            );

            if (!enableFilterResponse.ok) {
                const errorText = await enableFilterResponse.text();
                throw new Error(`Failed to enable basic filter: ${enableFilterResponse.status} - ${enableFilterResponse.statusText} - ${errorText}`);
            }

            const enableFilterResult = await enableFilterResponse.json();
            console.log("Enable filter result: ", enableFilterResult);

            return result;
        }
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