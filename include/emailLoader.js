var fs = require('fs');
var Q = require('q');
var csv = require("fast-csv");

/**
 * Reads the data from the given file.
 * Returns a promise which is resolved with a big honkin' object which
 * conains everything.
 */
exports.read = function(path) {

    // Load the input file, which contains the listing of student names
    //    and their parent's e-mail addresses.
    // The real joy here is that the e-mail spreadsheet is grouped by
    //    the teacher's name (yeah, not by classroom - sigh).
    var mapByTeacherName = {};
    var stream = fs.createReadStream(path);
    // set up a promise for reading the student/e-mail file
    var deferred = Q.defer();
    csv.fromStream(stream, {headers : true})
    .on("data", function studentEmail(data) {
        try {
            // This is a row/record from the file - note that a student's name
            //    may appear twice in the file, with two different parent e-mail
            //    addresses.
            var studentName = data['student.lastName'] + '_' + data['student.firstName'];
            studentName = studentName.toUpperCase();
            var email = data['contacts.email'];
            if (!email || email.length === 0 ) {
                //ignore this record.
                return;
            }
            var teacher = data['student.homeroomTeacher'];
            var classroomInfo = mapByTeacherName[teacher];
            if (!classroomInfo) {
                // first time we've seen this teacher's name
                classroomInfo = { teacher: teacher, students: {} };
                mapByTeacherName[teacher] = classroomInfo;
            }
            var studentInfo = classroomInfo.students[studentName];
            if  (! studentInfo ) {
                // first record for each student wins.
                classroomInfo.students[studentName] = email;
            }
        } catch (ex) {
            deferred.reject(ex);
        }
    })
    .on("end", function(){
        // cheat and attach the data to the promise
        deferred.promise.data = mapByTeacherName;
        deferred.resolve(mapByTeacherName);
    });
    return deferred.promise;
};


