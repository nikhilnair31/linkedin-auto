function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom')
    .addItem('Fetch Emails', 'fetchApolloEmails')
    .addItem('Draft Emails', 'composeEmailDrafts')
    .addItem('Update Status', 'updateStatus')
    .addToUi();
}

function fetchApolloEmails() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getActiveRange();
  var values = range.getValues();
  
  // Define the columns
  var hyperlinkCol = 1;
  var emailCol = 10;

  values.forEach(function(row, rowIndex) {
    Logger.log('Selected row: ' + row);

    var hyperlinkCell = range.offset(rowIndex, hyperlinkCol - range.getColumn(), 1, 1);
    var emailCell = range.offset(rowIndex, emailCol - range.getColumn(), 1, 1);
    var hyperlinkFormula = hyperlinkCell.getFormula();

    Logger.log('Hyperlink formula in row ' + (range.getRow() + rowIndex) + ': ' + hyperlinkFormula);

    if (hyperlinkFormula.startsWith('=HYPERLINK')) {
      var link = hyperlinkFormula.match(/HYPERLINK\("(.*?)",/)[1];
      Logger.log('Extracted link: ' + link);

      emailCell.setValue("Fetching...");

      fetchEmail(link, function(email, errorMessage) {
        if (email) {
          emailCell.setValue(email);
          Logger.log('Email fetched: ' + email);
        } else {
          emailCell.setValue(errorMessage);
          Logger.log('Error fetching email' + errorMessage);
        }
      });
    } else {
      emailCell.setValue("Invalid HYPERLINK formula");
      Logger.log('Invalid HYPERLINK formula in row: ' + (range.getRow() + rowIndex));
    }
  });
}
function fetchEmail(link, callback) {
  var apiUrl = 'https://api.apollo.io/v1/people/match'; // Apollo API URL
  var apiKey = ''; // Replace with your actual API key
  var payload = {
    "linkedin_url": link
  };
  
  var options = {
    'method': 'post',
    'headers': {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': apiKey
    },
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };

  Logger.log('API request payload: ' + JSON.stringify(payload));

  try {
    var response = UrlFetchApp.fetch(apiUrl, options);
    Logger.log('API response code: ' + response.getResponseCode());

    var result = JSON.parse(response.getContentText());

    if (result && result.person && result.person.email) {
      callback(result.person.email, null);
    } else {
      callback(null, "No email found in response");
    }
  } catch (e) {
    Logger.log('Error during API request: ' + e.toString());
    callback(null, 'Error during API request: ' + e.toString());
  }
}

function composeEmailDrafts() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getActiveRange();
  var values = range.getValues();

  // Define the columns
  var nameCol = 1;
  var jobsCol = 15;
  var companyCol = 9;
  var emailCol = 10;
  var emailedStatusCol = 11;
  var emailReplyStatusCol = 12;

  values.forEach(function(row, rowIndex) {
    Logger.log('Selected row: ' + row);

    var fullName = range.offset(rowIndex, nameCol - range.getColumn(), 1, 1).getValue();
    Logger.log('fullName: ' + fullName);
    var toEmailAddress = range.offset(rowIndex, emailCol - range.getColumn(), 1, 1).getValue();
    Logger.log('toEmailAddress: ' + toEmailAddress);

    if(toEmailAddress != 'Error fetching email' && toEmailAddress != '-') {
      var jobs = range.offset(rowIndex, jobsCol - range.getColumn(), 1, 1).getValue();
      Logger.log('jobs: ' + jobs);
      var companyName = range.offset(rowIndex, companyCol - range.getColumn(), 1, 1).getValue();
      Logger.log('companyName: ' + companyName);

      var resumeUrl = 'https://firebasestorage.googleapis.com/v0/b/nikhil-nair.appspot.com/o/Latest%20Gen%20AI.pdf?alt=media&token=e16da10c-8e91-40a3-8d1a-5d5c5d836f7e';
      var resumeResponse = UrlFetchApp.fetch(resumeUrl);
      var resumeBlob = resumeResponse.getBlob().setName('Resume.pdf');

      var firstName = fullName.split(' ')[0];
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      Logger.log('firstName: ' + firstName);

      var jobTuples = [];
      var jobsArray = jobs.split('\n');
      var jobPattern = /^(.*) - (https?:\/\/\S+)$/;
      jobsArray.forEach(function(jobEntry) {
        var match = jobEntry.match(jobPattern);
        if (match) {
          jobTuples.push([match[1].trim(), match[2]]);
        }
      });
      Logger.log('jobTuples: ' + jobTuples);

      var jobStr = "";
      var jobStrHtml = "";
      jobTuples.forEach(function(jobTuple, index) {
        var jobName = jobTuple[0];
        var jobUrl = jobTuple[1];
        
        if (index > 0 && index === jobTuples.length - 1) {
          jobStr += " and ";
          jobStrHtml += " and ";
        } else if (index > 0) {
          jobStr += ", ";
          jobStrHtml += ", ";
        }

        jobStr += jobName;
        jobStrHtml += `<a href="${jobUrl}" target="_blank">${jobName}</a>`;
      });
      Logger.log('jobStr: ' + jobStr);
      Logger.log('jobStrHtml: ' + jobStrHtml);
      
      var isPlural = jobTuples.length > 1;

      sendEmail(toEmailAddress, firstName, jobStr, jobStrHtml, isPlural, companyName, resumeBlob, function(status) {
        var emailedStatusCell = range.offset(rowIndex, emailedStatusCol - range.getColumn(), 1, 1);
        var emailReplyCell = range.offset(rowIndex, emailReplyStatusCol - range.getColumn(), 1, 1);
        emailedStatusCell.setValue(status);
        emailReplyCell.setValue("N");

        if (status) {
          Logger.log('Email drafted: ' + status);
        } else {
          Logger.log('Error drafting email');
        }
      });
    }
    else {
      Logger.log(`No email drafted for ${fullName}`);
    }
  });
}
function sendEmail(toEmailAddress, firstName, jobStr, jobStrHtml, isPlural, companyName, resumeBlob, callback) {
  var subject = `Application for ${jobStr} ${isPlural ? 'Roles' : 'Role'} at ${companyName}`;
  Logger.log('subject: ' + subject);

  var body = `
    <div style="font-size:12.8px">
      Hi ${firstName},
      <br><br>
      Hope you're well! I came across your profile via a listing on LinkedIn for the ${jobStrHtml} ${isPlural ? 'positions' : 'position'} at ${companyName}.
      With 2 years of experience in strategy consulting and analytics, I'm eager to learn more about the ${isPlural ? 'roles' : 'role'}.
      <br><br>
      Professionally, my 2-year stint in pharma consulting as a Data Analyst has honed my skills in applying a variety of statistical models on terabyte large datasets. Specifically, I have experience in identifying business challenges and providing strategic recommendations through analysis, to support new product launches. My proficiency in SQL and Python for data analysis and visualization coupled with my experience in problem-solving, hypothesis testing, and solution development, would allow me to contribute meaningfully to ${companyName}.
      <br><br>
      Additionally, my background in developing GenAI/LLM-based solutions gives me a unique edge, with in-depth knowledge of creating and deploying cutting-edge fine-tuned and RAG-supported models - as showcased in my Capstone Project at Microsoft. This perspective allows me to bring a unique value proposition to&nbsp;${companyName}, where I can contribute meaningfully to drive business growth and innovation.
      <br><br>
      I've attached my resume for your reference, which outlines my professional accomplishments in more detail. I'd be thrilled to discuss how my experience and skills align with the needs of the ${isPlural ? 'roles' : 'role'} at ${companyName}.
      <br><br>

      <div dir="ltr" class="gmail_signature">
        <div dir="ltr">
          <div style="border:0px;font-stretch:inherit;font-size:11pt;line-height:inherit;margin:0px;padding:0px;vertical-align:baseline;color:rgb(0,0,0)">
            <font face="trebuchet ms, sans-serif">
            Regards,
            </font>
          </div>
        <div style="border:0px;font-stretch:inherit;font-size:11pt;line-height:inherit;margin:0px;padding:0px;vertical-align:baseline;color:rgb(0,0,0)">
        <b>
        <font face="trebuchet ms, sans-serif">
        Nikhil Suresh Nair
        </font>
        </b>
        </div>
        <span style="color:rgb(232,230,227);font-size:14.6667px"><font face="trebuchet ms, sans-serif">
        EID: nn8446
        </font>
        </span>
        <div style="border:0px;font-stretch:inherit;font-size:11pt;line-height:inherit;margin:0px;padding:0px;vertical-align:baseline;color:rgb(0,0,0)">
        <font face="trebuchet ms, sans-serif">
        <span style="border:0px;font-style:inherit;font-variant:inherit;font-weight:inherit;font-stretch:inherit;font-size:9pt;line-height:inherit;margin:0px;padding:0px;vertical-align:baseline;color:inherit">
        Pronouns:&nbsp;
        </span>
          <span style="border:0px;font-style:inherit;font-variant:inherit;font-weight:inherit;font-stretch:inherit;font-size:9pt;line-height:inherit;margin:0px;padding:0px;vertical-align:baseline;color:inherit">
            <i>he/him</i>
          </span>
        <i>
        <br>
        </i>
          <span style="border:0px;font-style:inherit;font-variant:inherit;font-weight:inherit;font-stretch:inherit;font-size:9pt;line-height:inherit;margin:0px;padding:0px;vertical-align:baseline;color:rgb(222,106,25)">
            <b>MS in Business Analytics</b>
          </span>
        </font>
        </div>
        </div>
      </div>
    </div>`;

  Logger.log('body: ' + body);
  
  try {
    GmailApp.createDraft(toEmailAddress, subject, '', {htmlBody: body, attachments: [resumeBlob]});
    callback("Y");
  } catch (e) {
    Logger.log('Error during GMail Draft creation: ' + e.toString());
    callback("N");
  }
}

function updateStatus() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getActiveRange();
  var values = range.getValues();
  
  // Define the columns
  var hyperlinkCol = 1;

  var urlList = [];
  values.forEach(function(row, rowIndex) {
    var hyperlinkCell = range.offset(rowIndex, hyperlinkCol - range.getColumn(), 1, 1);
    var hyperlinkFormula = hyperlinkCell.getFormula();
    
    if (hyperlinkFormula.startsWith('=HYPERLINK')) {
      var link = hyperlinkFormula.match(/HYPERLINK\("(.*?)",/)[1];
      Logger.log('Extracted link: ' + link);
      
      var uniqueURL = link + "?id=statusCH3CK";
      urlList.push(uniqueURL);
    } 
    else {
      Logger.log('Invalid HYPERLINK formula in row: ' + (range.getRow() + rowIndex));
    }
  });
  Logger.log('URL list to open: ' + urlList);

  for (var i = 0; i < urlList.length; i++) {
    Logger.log('Opening URL: ' + urlList[i]);

    var html = '<script>window.open("' + urlList[i] + '", "_blank");google.script.host.close();</script>';
    var userInterface = HtmlService.createHtmlOutput(html);

    SpreadsheetApp.getUi().showModalDialog(userInterface, 'Opening URL...');
    Logger.log('Opened URL in modal dialog: ' + urlList[i]);

    // Sleep for a short period to allow the modal to open the URL
    Utilities.sleep(2000); // Adjust the delay as needed
  }
}