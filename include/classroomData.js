var fs = require('fs');
var Q = require('q');
var csv = require("fast-csv");

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
            var studentName = data['Student last'] + '_' + data['Student first '];
            var studentInfo = classroomInfo.students[studentName];
            if  (! studentInfo ) {
                // first record for each student wins.
                classroomInfo.students[studentName] = data;
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


