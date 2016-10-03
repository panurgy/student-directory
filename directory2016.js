var fs = require('fs');
var Q = require('q');
var csv = require("fast-csv");
var lodash = require('lodash');


// Parse the command line arguments
var argv = require('minimist')(process.argv.slice(2));

// grab the positional parameters and assume they're input file names.
var inputFiles = argv._;
if (inputFiles.length != 1 ) {
    console.log("Need the input CSV file: stuff.csv");
    console.log("   stuff.csv contains the student's info");
    return 1;
}

var emailDomain = argv.domain;
if (!emailDomain) {
    console.log("Need an arg:  --domain=your.email.domain.com");
    return 1;
}

// make sure all of the input files exist (synchronously)
inputFiles.map(fs.statSync);

console.log("Loading classroom info and home addresses from: " + inputFiles[0]);
var classroomLoader = require('./include/classroomLoader');
var classroomPromise = classroomLoader.read(inputFiles[0]);

///console.log("Loading email addresses from: " + inputFiles[1]);
///var emailLoader = require('./include/emailLoader');
//var emailPromise = emailLoader.read(inputFiles[1]);

//var mergeUtils = require('./include/mergeUtils');
var allTeachers;

Q.all([classroomPromise]).then(function() {
    var classroomStream = fs.createWriteStream("classTEMP.x");
    classroomStream.once('open', function(fd) {
        classroomStream.write(JSON.stringify(classroomPromise.data, null, '\t'));
        classroomStream.end();
    });

    // Great, we've loaded both files. Merge them!
    //mergeUtils.mergeClassroomAndEmail(classroomPromise.data);
    //console.log(classroomPromise.data);
    //allTeachers = mergeUtils.resolveTeachers(classroomPromise.data);
    //console.log(allTeachers);

})
.catch(function(e) {
    if (e.leftovers) {
        console.log(e);
    } else {
        throw e;
    }
})
.finally(function() {
    //if (!allTeachers) return;

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
        var headings = ['Student Name', 'Address', 'Phone', 'Email'];
        headings = headings.map(capitalUtil.doubleQuote);

        lodash.forOwn(classroomPromise.data, function(value, key) {
            lodash.forOwn(value.students, function(value, key) {
                if (value['Room'] !== currentClassroom) {
                    // looks like we've entered a new classroom.
                    currentClassroom = value['Room'] || 101;
                    var grade = currentClassroom[0];
                    switch (grade) {
                        case 'K': grade = 'Kindergarten'; break;
                        case '1': grade = '1st Grade'; break;
                        case '2': grade = '2nd Grade'; break;
                        case '3': grade = '3rd Grade'; break;
                        default: grade = grade + 'th Grade'; break;
                    }
                    finalStream.write(grade + ' - Room ' + currentClassroom +'\n');
                    //var teacherName = allTeachers[currentClassroom];
                    //var teacherEmail = teacherName.charAt(0) +
                    //    teacherName.split(' ')[1] + '@' + emailDomain;
                    //teacherEmail = teacherEmail.toLowerCase();
                    finalStream.write(
                        '' +
                        '  / ' + '@' + emailDomain + '\n');
                    finalStream.write(headings.join(',') + '\n');
                    classroomCount ++;
                }
                var record = [
                    value['First Name'] + ' ' +
                    value['Last Name'],
                    value['address1'] +' '+
                        value['address2'], // which has the State and Zip too
                    value['Cell Phone'].replace(/\)/g, ') '),
                    value['Email']
                ];
                record = record.map(capitalUtil.maybeCapitalizeFirst);
                record = record.map(capitalUtil.doubleQuote);
                finalStream.write(record.join(',') + '\n');
                studentCount ++;
            });
            finalStream.write('\n');
        });
        finalStream.end();
        console.log("Classrooms: " + classroomCount);
        console.log("Students: " + studentCount);
        console.log("Saved file: " + FINAL_OUT_FILENAME);
    });

})
.done();



//var doc = new pdfkit({layout:'landscape'});



