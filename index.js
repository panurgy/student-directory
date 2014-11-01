var fs = require('fs');
var Q = require('q');
var csv = require("fast-csv");
var pdfkit = require('pdfkit');
var lodash = require('lodash');


// Parse the command line arguments
var argv = require('minimist')(process.argv.slice(2));
console.dir(argv);

// grab the positional parameters and assume they're input file names.
var inputFiles = argv._;
if (inputFiles.length != 2 ) {
    console.log("Need two input CSV files: directory.csv  email.csv");
    console.log("   directory.csv contains the student's name and mailing address");
    console.log("   email.csv conains the student's name and the e-mail address");
    return 1;
}

// make sure all of the input files exist (synchronously)
inputFiles.map(fs.statSync);

var classroomData = require('./include/classroomData');
var classroomPromise = classroomData.read(inputFiles[0]);

var emailData = require('./include/emailData');
var emailPromise = emailData.read(inputFiles[1]);

Q.all([classroomPromise, emailPromise]).then(function() {
    // Great, we've loaded both files. Merge them!
    //
    // TODO-need a spread sheet that contains the staff information.
});
    

//var doc = new pdfkit({layout:'landscape'});



