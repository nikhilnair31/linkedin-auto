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
    if (message.action === "interactApollo") {
        fetchApolloEmail();
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
            return "Hi {name}! As a fellow UT MSBA student, I'm really inspired by your journey at {company}. I'm looking into the Sr. Data Science role & was wondering if you have any advice or know of any openings internally. I'd love to learn more about the role and possibly have you review my resume or refer me? Thanks!";
        } 
        if (typeText == "ZS Alum") {
            return "Hi {name}! As a ZS alum and recent UT MSBA grad, I'm keen on Data Science/Analyst roles and inspired by your move to {company}. With 2 yrs in consulting & analytics, I believe I'd be a great fit. Would you have any advice or know of any openings on your team? I'd love a brief chat if you're available. Thanks!";
        } 
        if (typeText == "Recruiter") {
            return "Hi {name}, I'm an MSBA grad from UT and an aspiring Data Scientist. With 2 years in pharma strategy consulting & analytics, I think I'd excel in similar roles at {company}.  I'd love to connect and discuss further opportunities if you'd be open to a brief chat/resume review? Thanks!";
        } 
        if (typeText == "General") {
            return "Hi {name}! As an MSBA grad from UT, I'm inspired by your journey at {company} & interested in the Sr. Data Scientist role. With 2 yrs in pharma strategy consulting & analytics, I believe I'd be a great fit. I'd love to connect and discuss opportunities if you'd be open to a brief chat? Thanks!";
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
    let profileUrl = window.location.href;
    let profileText = document.querySelector(".mt2.relative").innerText;
    let currDate = formatDate(new Date());
    let fullName = document.querySelector(".text-heading-xlarge.inline.t-24.v-align-middle.break-words").innerText;
    let formattedName = `=HYPERLINK("${profileUrl}", "${fullName}")`;
    let firstName = getFirstWord(fullName);
    let school = document.querySelector(".pv-text-details__right-panel-item-text").innerText.trim();
    // FIXME: This breaks when profile has no company in the header area. Check same for no school also.
    let company = document.querySelector(".QXKGsjdyqdqwHmLQHekyaekuIfvbFzrvlkJI .rapjPUgpodXzhasLarIJxQRvagGOVLaRjEfkM").innerText.trim();
    let email = fetchApolloEmail();
    let type = selectType(profileText);
    let template = selectMessageTemplate(type);
    let message = customizeTemplate(template, firstName, company);
    
    // Log the message to the console
    console.log(`profileText: ${profileText}`);
    console.log(`currDate: ${currDate}`);
    console.log(`fullName: ${fullName}`);
    console.log(`formattedName: ${formattedName}`);
    console.log(`firstName: ${firstName}`);
    console.log(`school: ${school}`);
    console.log(`company: ${company}`);
    console.log(`email: ${email}`);
    console.log(`profileUrl: ${profileUrl}`);
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
        type === "Recruiter" ? "Y" : "N",
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
        // Try finding the connect button directly
        let connectButton;
        if(document.querySelector(`button[aria-label*='Invite ${profileName} to connect']`)) {
            connectButton = document.querySelector(`button[aria-label*='Invite ${profileName} to connect']`);
        }
        else if(document.querySelector(`div[aria-label*='Invite ${profileName} to connect']`)) {
            connectButton = document.querySelector(`button[aria-label*='Invite ${profileName} to connect']`);
        }
        else {
            alert("No connect button :(")
        }
        console.log(`connectButton: ${connectButton}`);
        
        if (connectButton) {
            connectButton.click();
        } 
        else {
            // If not found, try finding it in the dropdown menu
            let moreActionsButton = document.querySelector("button[aria-label='More actions']");
            console.log(`moreActionsButton: ${moreActionsButton}`);
            
            if (moreActionsButton) {
                moreActionsButton.click();
                setTimeout(() => {
                    let dropdownConnectButton = document.querySelector("div[role='button'][aria-label*='Invite']");
                    console.log(`dropdownConnectButton: ${dropdownConnectButton}`);
                    
                    if (dropdownConnectButton) {
                        dropdownConnectButton.click();
                    }
                }, 500);
            }
        }
    }
    // Send connection request
    clickConnectButton(fullName);
    
    // Add note and send
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
                }
            }, 1000);
        }
    }, 1000);
    
    // Attach event listener to the send button
    let sendButton = document.querySelector("button[aria-label='Send now']");
    if (sendButton) {
        sendButton.addEventListener('click', dataToSheet);
    }
}
function dataToSheet() {
    console.log("dataToSheet");
    
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
    }, 1000);
}

async function fetchApolloEmail() {
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
        
        if (data.person && data.person.email) {
            const email = data.person.email;
            console.log("Email: ", email);
            return email;
        } else {
            console.log("Email not found in response.");
        }
    } catch (error) {
        console.error("Error fetching email:", error);
    }
}