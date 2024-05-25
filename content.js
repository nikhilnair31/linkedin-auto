// content.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("chrome.runtime.onMessage.addListener");
    console.log(`message.action: ${message.action}`);
    
    if (message.action === "startAutomation") {
        automateLinkedIn();
    }
    if (message.action === "insertData") {
        dataToSheet();
    }
    if (message.action === 'confirmDuplicate') {
        const confirmOverride = confirm(`Profile already exists in the sheet. Do you want to override and insert a duplicate?`);
        sendResponse({ confirm: confirmOverride });
    }
});

// Function to pull profile data
function getProfileData() {
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
    // Function to select message template
    function selectMessageTemplate(typeText) {
        if (typeText == "UT Alum") {
            return "Hi {name}! As a fellow UT MSBA student, I'm really inspired by your journey at {company}. I'm looking into Data Science/Analyst roles & was wondering if you have any advice or know of any openings internally. I'd love to learn more about the role and possibly have you review my resume or refer me? Thanks!";
        } 
        if (typeText == "ZS Alum") {
            return "Hi {name}! As a ZS alum and recent UT MSBA grad, I'm keen on Data Science/Analyst roles and inspired by your move to {company}. With 2 yrs in consulting & analytics, I believe I'd be a great fit. Would you have any advice or know of any openings on your team? I'd love a brief chat if you're available. Thanks!";
        } 
        if (typeText == "Recruiter") {
            return "Hi {name}, I'm an MSBA grad from UT and an aspiring Data Scientist. With 2 years in pharma strategy consulting & analytics, I think I'd excel in similar roles at {company}.  I'd love to connect and discuss further opportunities if you'd be open to a brief chat/resume review? Thanks!";
        } 
        if (typeText == "General") {
            return "Hi {name}! As an MSBA grad from UT, I'm inspired by your journey at {company} & interested in Data Science/Analyst roles. With 2 yrs in pharma strategy consulting & analytics, I believe I'd be a great fit. I'd love to connect and discuss opportunities if you'd be open to a brief chat? Thanks!";
        }
    }
    // Function to customize the template
    function customizeTemplate(template, name, company) {
        return template.replace("{name}", name).replace("{company}", company);
    }
    // Function to get the first word
    function getFirstWord(str) {
        return str.split(' ')[0];
    }
    // Function to get current date in format
    function formatDate(date) {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }
    
    // Extract profile details
    let currDate = formatDate(new Date());
    let profileText = document.querySelector(".mt2.relative").innerText;
    
    // Get name and profile URL
    let profileUrl = window.location.href;
    let fullName = document.querySelector(".text-heading-xlarge.inline.t-24.v-align-middle.break-words").innerText;
    let firstName = getFirstWord(fullName);
    let formattedName = `=HYPERLINK("${profileUrl}", "${fullName}")`;
    
    // Check for the company element
    let companyElement = document.querySelector(".QXKGsjdyqdqwHmLQHekyaekuIfvbFzrvlkJI .rapjPUgpodXzhasLarIJxQRvagGOVLaRjEfkM");
    let company = companyElement ? getFirstWord(companyElement.innerText.trim()) : "-";
    
    // Check for the school element
    let schoolElement = document.querySelector(".QXKGsjdyqdqwHmLQHekyaekuIfvbFzrvlkJI .pv-text-details__right-panel-item-text");
    let school = schoolElement ? schoolElement.innerText.trim() : "-";
    
    // Fecth email from Apollo depending on connection type
    let type = selectType(profileText);
    let isRecruiter = (type === "Recruiter") ? "Y" : "N";
    let email = (type === "Recruiter") ? fetchApolloEmail() : "-";
    
    let template = selectMessageTemplate(type);
    let message = customizeTemplate(template, firstName, company);
    
    // Log the message to the console
    console.log(`currDate: ${currDate}`);
    console.log(`profileText: ${profileText}`);
    console.log(`profileUrl: ${profileUrl}`);
    console.log(`fullName: ${fullName}`);
    console.log(`firstName: ${firstName}`);
    console.log(`formattedName: ${formattedName}`);
    console.log(`company: ${company}`);
    console.log(`school: ${school}`);
    console.log(`email: ${email}`);
    console.log(`type: ${type}`);
    console.log(`template: ${template}`);
    console.log(`message: ${message}`);
    
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
    ]];
    console.log("data: ", data);
    
    return data
}

function automateLinkedIn() {
    console.log("automateLinkedIn");
    
    // Populating Profile related vars
    const data = getProfileData();
    fullName = data[0][0];
    message = data[0][13];
    
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
    
    // Update the mesage var to contain the updated message
    let noteTextarea = document.querySelector("textarea[name='message']");
    if (noteTextarea) {
        console.log("noteTextarea.value: ", noteTextarea.value);
        console.log("message: ", message);
        message = noteTextarea.value;
    }
    
    // Get sheetId and name and send message to insert data
    chrome.storage.local.get(['saved_spreadsheetId', 'saved_sheetName'], function(result) {
        chrome.runtime.sendMessage(
            {
                action: 'insertData',
                spreadsheetId: result.saved_spreadsheetId,
                sheetName: result.saved_sheetName,
                data: getProfileData()
            },
            (response) => {
                console.log("insertDataToSheet: Received response from background script", response);
                
                if (response.status === 'success') {
                    console.log('Data inserted:', response.response);
                } 
                else {
                    console.error('Error inserting data:', response.error);
                }
            }
        );
    });
    
    // Close tab after a delay
    console.log("Closing tab!");
    setTimeout(() => {
        chrome.runtime.sendMessage({ action: "closeTab" });
    }, 3000);
}

async function fetchApolloEmail() {
    console.log("fetchApolloEmail");
    
    try {
        const { saved_apolloApiKey: apiKey } = await chrome.storage.local.get('saved_apolloApiKey');
        
        if (!apiKey) {
            console.error("API key not found in storage.");
            return;
        }
        
        const apiUrl = "https://api.apollo.io/v1/people/match";
        const requestData = {
            linkedin_url: window.location.href
        };
        
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "X-Api-Key": apiKey
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("data: ", data);
        
        if (data.person && data.person.email) {
            console.log("Email: ", data.person.email);
            return data.person.email;
        } 
        else {
            console.log("Email not found in response.");
            return "-";
        }
    } 
    catch (error) {
        console.error("Error fetching email:", error);
    }
}