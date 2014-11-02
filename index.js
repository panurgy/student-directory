var fs = require('fs');
var Q = require('q');
var csv = require("fast-csv");
var pdfkit = require('pdfkit');
var lodash = require('lodash');


// Parse the command line arguments
var argv = require('minimist')(process.argv.slice(2));

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

console.log("Loading classroom info and home addresses from: " + inputFiles[0]);
var classroomLoader = require('./include/classroomLoader');
var classroomPromise = classroomLoader.read(inputFiles[0]);

console.log("Loading email addresses from: " + inputFiles[1]);
var emailLoader = require('./include/emailLoader');
var emailPromise = emailLoader.read(inputFiles[1]);

var mergeUtils = require('./include/mergeUtils');

Q.all([classroomPromise, emailPromise]).then(function() {
    var classroomStream = fs.createWriteStream("classTEMP.x");
    classroomStream.once('open', function(fd) {
        classroomStream.write(JSON.stringify(classroomPromise.data, null, '\t'));
        classroomStream.end();
    });

    var emailStream = fs.createWriteStream("emailTEMP.x");
    emailStream.once('open', function(fd) {
        emailStream.write(JSON.stringify(emailPromise.data, null, '\t'));
        emailStream.end();
    });

    // Great, we've loaded both files. Merge them!
    mergeUtils.mergeClassroomAndEmail(classroomPromise.data,
        emailPromise.data);
    //console.log(classroomPromise.data);
})
.catch(function(e) {
    if (e.leftovers) {
        console.log(e);
    } else {
        throw e;
    }
})
.finally(function() {
    // Dump everything to a new CSV file for the student directory.
    // In a perfect world, we'd generate the PDF here (and earlier versions
    //    of this generator tried that), but it turns out that there are
    //    numerious "little adjustments" that are needed afterward,
    //    that it's just easier to generate a big CSV, import it into a
    //    graphical spreadsheet editor, and customize everything.
    var capitalUtil = require('./include/capitalUtil');
    var FINAL_OUT_FILENAME = "student_directory.csv";
    var finalStream = fs.createWriteStream(FINAL_OUT_FILENAME);
    var currentClassroom = '';
    // Mostly pointless counters, only because I'm such a huge stats geek.
    var classroomCount = 0, studentCount = 0;
    finalStream.once('open', function(fd) {
        var headings = ['Last Name', 'First Name', 'Primary Phone', 'Primary Address', 'Email Adddress'];
        headings = headings.map(capitalUtil.doubleQuote);
        finalStream.write(headings.join(',') + '\n');

        lodash.forOwn(classroomPromise.data, function(value, key) {
            lodash.forOwn(value.students, function(value, key) {
                if (value['Room'] !== currentClassroom) {
                    // looks like we've entered a new classroom.
                    currentClassroom = value['Room'];
                    finalStream.write(',,' + currentClassroom +',,\n');
                    classroomCount ++;
                }
                var record = [
                    value['Student last'],
                    value['Student first '],
                    value['Home number'],
                    value['Street Address'] +' '+
                        value['City'], // which has the State and Zip too
                    value['email']
                ];
                record = record.map(capitalUtil.maybeCapitalizeFirst);
                record = record.map(capitalUtil.doubleQuote);
                finalStream.write(record.join(',') + '\n');
                studentCount ++;
            });
        });
        finalStream.end();
        console.log("Classrooms: " + classroomCount);
        console.log("Students: " + studentCount);
        console.log("Saved file: " + FINAL_OUT_FILENAME);
    });

})
.done();



//var doc = new pdfkit({layout:'landscape'});



