var fs = require('fs');
var Q = require('q');
var csv = require("fast-csv");

/**
 * Given an "existing" string of info (like the "primary phone" or "e-mail" address)
 * for a student, combine it wtih the "new" string.
 *
 * Basically, if the "existing" is "empty", then the "new" is used.
 * Otherwise, the two are used, with a newline in between.
 */
var combineData = function(existingString, newString) {
    var s = existingString;
    if (!s || s.length === 0) {
        return newString;
    }

    if (!newString || newString.length === 0) {
        return existingString;
    }

    if (existingString.indexOf(newString) > -1) {
        // the existingString already contains that info - ignore it.
        return existingString;
    }

    return existingString +'  ' + newString;
}

/**
 * Reads the data from the given file.
 * Returns a promise which is resolved with a big honkin' object which
 * conains everything.
 */
exports.read = function(path) {

    // Load the input file, which contains the listing of student names,
    // mailing addresses, and their classroom number.
    var mapByClassroom = {};
    var stream = fs.createReadStream(path);
    // set up a promise for reading the student/classroom file
    var deferred = Q.defer();
    csv.fromStream(stream, {headers : true})
    .on("data", function classroomStudentParser(data) {
        try {
            // this is a row/record from the file - note that a student's name
            // may appear twice in the file, with two different parent names
            // and address/phone numbers
            var classroomName = data.Room;
            var classroomInfo = mapByClassroom[classroomName];
            if (!classroomInfo) {
                // first time we've seen this classroom
                classroomInfo = {room:classroomName, teacher: {}, students: {}};
                mapByClassroom[classroomName] = classroomInfo;
            }

            // see if this student already has a record in the classroomInfo
            var studentKey = data['Last Name'] + '_' + data['First Name'];
            studentKey = studentKey.toUpperCase();
            var studentInfo = classroomInfo.students[studentKey];
            if  (! studentInfo ) {
                // first record for each student wins.
                classroomInfo.students[studentKey] = data;
            } else {
                // we have a row of data for this student. Combine stuff.
                studentInfo.Email = combineData(studentInfo.Email, data.Email);
                studentInfo['Cell Phone'] = combineData(studentInfo['Cell Phone'], data['Cell Phone']);
            }

        } catch (ex) {
            deferred.reject(ex);
        }
    })
    .on("end", function(){
        // cheat and attach the data to the promise
        deferred.promise.data = mapByClassroom;
        deferred.resolve(mapByClassroom);
    });
    return deferred.promise;
};


