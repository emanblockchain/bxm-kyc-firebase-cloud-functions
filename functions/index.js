'use strict';

const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const EmailTemplate = require('email-templates');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
// Configure the email transport using the default SMTP transport and a GMail account.
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

const readHTMLFile = function(path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, (err, html)=>{
        if (err) {
          console.log(err);
        }
        else {
          return callback(null, html);
        }
    });
};


// Sends an email to support when user submits kyc documents
exports.sendEmailKycEmailToSupport = functions.database.ref('/kycData/{uid}/{tierName}').onWrite((change, userData) => {
  if(change.after.val() === "pending"){
    const snapshot = change.after;
    const val = snapshot.val();

    const dirPath = snapshot._path;
    const dirPathSplit = dirPath.split("/");
    const username = userData.params.uid;
    const tierName = userData.params.tierName;
    
    const tiers = {
      tier1Status: "Tier 1",
      tier2Status: "Tier 2",
      tier3Status: "Tier 3"
    };

    //if (!snapshot.changed('subscribedToMailingList')) {
      //return null;
    //}

    readHTMLFile(path.resolve(__dirname, 'emails/newkyc.html'), (err, html)=>{
        if (err) {
            console.log(err);
        }
        const template = handlebars.compile(html);
        const replacements = {
           username: username,
           tierName: tiers[tierName]
        };
        const htmlToSend = template(replacements);
        const mailOptions = {
            from: '"BXM." <noreply@firebase.com>',
            to: "support@exchangemalaysia.io",
            subject :`${username} ${tiers[tierName]} KYC Documents`,
            html : htmlToSend
         };
        mailTransport.sendMail(mailOptions,(error, response)=>{
            if (error) {
                console.log(error);
            }
        });
    });
  }

});