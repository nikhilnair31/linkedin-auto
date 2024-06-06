// content.js

function onPageLoad() {
    if (window.location.hostname === "www.linkedin.com" && window.location.href.includes("?id=statusCH3CK")) {
        updatedStatusInSheet();
    }
}
function runAfterDelay() {
    setTimeout(onPageLoad, 2000);
}
runAfterDelay();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("chrome.runtime.onMessage.addListener");
    console.log(`message.action: ${message.action}`);
    
    if (message.action === "startAutomation") {
        automateLinkedIn();
    }
    if (message.action === "insertData") {
        dataToSheet();
    }
    if (message.action === "updateStatus") {
        updatedStatusInSheet();
    }
    if (message.action === 'confirmDuplicate') {
        const confirmOverride = confirm(`Profile already exists in the sheet. Do you want to override and insert a duplicate?`);
        sendResponse({ confirm: confirmOverride });
    }
});

// Function to pull profile data
function fullPull_ProfileData() {
    // Function to select type of connection
    function selectType(profileText) {
        if (profileText.includes('UT') || profileText.includes('The University of Texas at Austin')) {
            return "UT Alum"
        } 
        else if (profileText.includes('ZS')) {
            return "ZS Alum"
        } 
        else if (profileText.toLowerCase().includes('recruiter') || profileText.toLowerCase().includes('talent')) {
            return "Recruiter"
        } 
        else {
            return "General"
        }
    }
    // Function to get current date in format
    function formatDate(date) {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }
    // Function to get the first word
    function getFirstWord(str) {
        return str.split(' ')[0];
    }
    // Function to select message template
    function selectMessageTemplate(typeText) {
        if (typeText == "UT Alum") {
            return "Hi {name}! As a fellow UT grad in MSBA, I'm really inspired by your journey at {company}. I'm looking into Data Science/Analyst roles & was wondering if you have any advice or know of any internal openings. I'd love to learn more about the role & possibly have you review my resume/refer me? Thanks!";
        } 
        if (typeText == "ZS Alum") {
            return "Hi {name}! As a ZS alum & recent UT MSBA grad, I'm keen on Data Science/Analyst roles & inspired by your move to {company}. With 2 yrs in consulting & analytics, I believe I'd be a great fit. Would you have any advice or know of any openings on your team? I'd love a brief chat if you're available. Thanks!";
        } 
        if (typeText == "Recruiter") {
            return "Hi {name}, I'm an MSBA grad from UT & an aspiring Data Scientist. With 2 years in strategy consulting & analytics, I think I'd excel in similar roles at {company}.  I'd love to connect & discuss further opportunities if you'd be open to a brief chat/resume review? Thanks!";
        } 
        if (typeText == "General") {
            return "Hi {name}! As an MSBA grad from UT, I'm inspired by your journey at {company} & interested in Data Science/Analyst roles. With 2 yrs in strategy consulting & analytics, I believe I'd be a great fit. I'd love to connect & discuss opportunities if you'd be open to a brief chat? Thanks!";
        }
    }
    // Function to customize the template
    function customizeTemplate(template, name, company) {
        return template.replace("{name}", name).replace("{company}", company);
    }
    
    // Check for profile name
    let fullName = document.querySelector(".text-heading-xlarge.inline.t-24.v-align-middle.break-words").innerText;
    let firstName = getFirstWord(fullName);
    
    // Check for the company element
    let companyElement = document.querySelector(".pv-text-details__right-panel button[aria-label*='Current company']");
    let company = companyElement ? companyElement.innerText.trim() : "-";
    console.log(`company: ${company}`);
    
    // Fetch recruiter status
    let profileText = document.querySelector(".mt2.relative").innerText;
    // console.log(`profileText: ${profileText}`);
    let type = selectType(profileText);
    let isRecruiter = (type === "Recruiter") ? "Y" : "N";
    
    // Update the message variable to contain the updated message
    let template = "-";
    let message = "-";
    let noteTextarea = document.querySelector("textarea[name='message']");
    if (noteTextarea && noteTextarea.value.trim() !== "") {
        message = noteTextarea.value;
    } 
    else {
        template = selectMessageTemplate(type);
        message = customizeTemplate(template, firstName, company);
    }
    
    // Keep empty email var
    let email = "-";
    
    // Extract today's date formatted
    let currDate = formatDate(new Date());
    
    // Get name and profile URL
    let profileUrl = window.location.href;
    let formattedName = `=HYPERLINK("${profileUrl}", "${fullName}")`;
    
    // Check for the school element
    let schoolElement = document.querySelector(".QXKGsjdyqdqwHmLQHekyaekuIfvbFzrvlkJI .pv-text-details__right-panel-item-text");
    let school = schoolElement ? schoolElement.innerText.trim() : "-";
    
    // Create array of data to then insert
    const data = [[
        formattedName,
        'Y',
        currDate,
        'N',
        'N',
        0,
        'N',
        '-',
        company,
        email,
        '-',
        '-',
        isRecruiter,
        message,
        '-'
    ]];
    console.log("data: ", data);
    
    // Validate data before returning
    for (let i = 0; i < data[0].length; i++) {
        if (data[0][i] === undefined || data[0][i] === null || (typeof data[0][i] === 'object' && Object.keys(data[0][i]).length === 0)) {
            data[0][i] = '-';
        }
    }
    console.log("cleaned data: ", data);
    
    return data;
}
// Function to get profile's status
function status_ProfileData() {
    // Function to check the current connection status
    function getCurrentStatus(fullName) {
        const selectors = {
            yetToConnect: [
                `.ph5.pb5 button[aria-label*='Invite']`,
                `.ph5.pb5 button[aria-label*='Invite ${fullName} to connect'] button`,
                // `.ph5.pb5 div[aria-label*='Invite ${fullName} to connect'] button`,
                // `.ph5 button[aria-label*='Invite']`,
                // `.ph5 button[aria-label*='Invite ${fullName} to connect'] button`,
                // `.ph5 div[aria-label*='Invite ${fullName} to connect'] button`
            ],
            pendingConnection: [
                `.ph5.pb5 button[aria-label*='Pending']`,
                `.ph5.pb5 button[aria-label*='Pending, click to withdraw invitation sent to ${fullName}']`,
                `.ph5 button[aria-label*='Pending']`,
                `.ph5 button[aria-label*='Pending, click to withdraw invitation sent to ${fullName}']`,
            ],
            completedConnection: [
                `.ph5.pb5 button[aria-label*='Remove']`,
                `.ph5.pb5 button[aria-label*='Remove your connection to ${fullName}']`,
                `.ph5 button[aria-label*='Remove']`,
                `.ph5 button[aria-label*='Remove your connection to ${fullName}']`,
            ]
        };

        for (const [status, elements] of Object.entries(selectors)) {
            if (elements.some(selector => document.querySelector(selector))) {
                if (status === "yetToConnect") {
                    return "YET TO SEND CONNECTION REQUEST"
                }
                else if (status === "pendingConnection") {
                    return "PENDING"
                }
                else if (status === "completedConnection") {
                    return "NEED TO THANK THEM FOR ACCEPTING"
                }
            }
        }
        return "-";
    }

    let fullName = document.querySelector(".text-heading-xlarge.inline.t-24.v-align-middle.break-words").innerText;
    let currStatus = getCurrentStatus(fullName);
    
    // Create array of data to then insert
    const data = [[
        fullName,
        currStatus,
    ]];
    console.log("data: ", data);
    
    // Validate data before returning
    for (let i = 0; i < data[0].length; i++) {
        if (data[0][i] === undefined || data[0][i] === null || (typeof data[0][i] === 'object' && Object.keys(data[0][i]).length === 0)) {
            data[0][i] = '-';
        }
    }
    console.log("cleaned data: ", data);
    
    return data;
}

// Function to run on message action
function automateLinkedIn() {
    console.log("automateLinkedIn");
    
    // Retreieve initial Profile related vars
    const data = fullPull_ProfileData();
    const fullName = data[0][0];
    const message = data[0][13];
    
    // Function to click the connect button
    function clickConnectButton(profileName) {
        const connectButton = document.querySelector(`.ph5.pb5 button[aria-label*='Invite']`) ||
        document.querySelector(`.ph5.pb5 button[aria-label*='Invite ${profileName} to connect'] button`) ||
        document.querySelector(`.ph5.pb5 div[aria-label*='Invite ${profileName} to connect'] button`) ||
        document.querySelector(`.ph5 button[aria-label*='Invite']`) ||
        document.querySelector(`.ph5 button[aria-label*='Invite ${profileName} to connect'] button`) ||
        document.querySelector(`.ph5 div[aria-label*='Invite ${profileName} to connect'] button`);
        
        if (connectButton) {
            console.log(`connectButton: ${connectButton}`);
            connectButton.click();
        }
        else {
            const moreActionsButton = document.querySelector(".ph5.pb5 button[aria-label='More actions']") ||
            document.querySelector(`.ph5 button[aria-label='More actions']`);
            console.log(`moreActionsButton: ${moreActionsButton}`);
            
            if (moreActionsButton) {
                moreActionsButton.click();
                setTimeout(() => {
                    const dropdownConnectButton = document.querySelector(".ph5.pb5 div[role='button'][aria-label*='Invite']") ||
                    document.querySelector(`.ph5 div[role='button'][aria-label*='Invite']`);
                    dropdownConnectButton ? dropdownConnectButton.click() : alert("No connect button :(");
                }, 500);
            }
        }
    }
    clickConnectButton(fullName);
    
    // Add note
    setTimeout(() => {
        let addNoteButton = document.querySelector("button[aria-label='Add a note']");
        if (addNoteButton) {
            addNoteButton.click();
            setTimeout(() => {
                let noteTextarea = document.querySelector("textarea[name='message']");
                if (noteTextarea) {
                    noteTextarea.value = message;
                    
                    // Select the entire text
                    noteTextarea.focus();
                    noteTextarea.select();
                    
                    // Simulate backspace and undo
                    document.execCommand('insertText', false, noteTextarea.value.slice(0, -1)); // Backspace last character
                    document.execCommand('undo');
                    
                    noteTextarea.style.height = '200px';
                }
            }, 1000);
        }
    }, 1000);
    
    // Find note modal and attach click listener to send note button
    const targetNode = document.getElementById("artdeco-modal-outlet");
    if (targetNode) {
        const attachEventListener = (sendButton) => {
            if (sendButton) {
                sendButton.addEventListener("click", dataToSheet);
                console.log("Event listener attached to Send button");
            }
        };
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        attachEventListener(node.querySelector("button[aria-label*='Send']"));
                    }
                });
            });
        });
        
        observer.observe(targetNode, { childList: true, subtree: true });
        attachEventListener(document.querySelector("#artdeco-modal-outlet button[aria-label*='Send']"));
    } 
    else {
        console.error("Target node #artdeco-modal-outlet not found");
    }
}
function dataToSheet() {
    console.log("dataToSheet");
    
    chrome.storage.local.get(['saved_spreadsheetId', 'saved_sheetName'], (result) => {
        const { saved_spreadsheetId: spreadsheetId, saved_sheetName: sheetName } = result;
        chrome.runtime.sendMessage(
            {
                action: 'insertData',
                spreadsheetId,
                sheetName,
                data: fullPull_ProfileData()
            },
            (response) => {
                console.log("Response:", response);
            }
        );
    });
    
    console.log("Closing tab!");
    setTimeout(() => chrome.runtime.sendMessage({ action: "closeTab" }), 1000);
}
function updatedStatusInSheet() {
    console.log("updatedStatusInSheet");
    
    chrome.storage.local.get(['saved_spreadsheetId', 'saved_sheetName'], (result) => {
        const { saved_spreadsheetId: spreadsheetId, saved_sheetName: sheetName } = result;
        const data = status_ProfileData();
        console.log(`data: ${data}`);
        const profileName = data[0][0];
        console.log(`profileName: ${profileName}`);
        const status = data[0][1];
        console.log(`status: ${status}`);

        chrome.runtime.sendMessage(
            {
                action: 'updateStatus',
                spreadsheetId,
                sheetName,
                profileName,
                status
            },
            (response) => {
                console.log("Response:", response);
            }
        );
    });
    
    console.log("Closing tab!");
    setTimeout(() => chrome.runtime.sendMessage({ action: "closeTab" }), 1000);
}