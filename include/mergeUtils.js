/**
 *  Contains lots of routines for merging very large objects of info
 *  together.
 */
var lodash = require('lodash');

/**
 * Given the objects which effectively contain everything from the
 * two spreadsheets, merge them together.
 * @param classroomData the stuff loaded from the mailing address spredsheet.
 * The student info objects within this WILL BE MODIFIED and will have the
 * email address added.
 * @param emailData the stuff loaded from the e-mail listing spreadsheet.
 */
exports.mergeClassroomAndEmail = function MergeClassroomAndEmail(classroomData, emailData) {
    // First up, go through the classroomData and build an index for
    //   all of the students contained within it. If there's a duplicate,
    //   this will throw an exception (because this routine is too stupid to
    //   know how to handle that situation).
    var allStudents = {};
    lodash.forOwn(classroomData, function(value, key, object) {
        lodash.forOwn(value.students, function(studentInfo, studentKey) {
            if (allStudents[studentKey]) {
                throw new Error("Duplicate student key: " + studentKey);
            }
            allStudents[studentKey] = studentInfo;
        });
    });

    // Next up, go through the e-mail addresses, and see which student
    //    names match up.
    var leftovers = [];

    lodash.forOwn(emailData, function(value, key, object) {
        lodash.forOwn(value.students, function(emailAddress, studentKey) {
            if (! allStudents[studentKey]) {
                // we have an e-mail record for a student who wasn't in the
                //     classroom spreadsheet. We'll need a human to
                //     figure out this mismatch.
                leftovers.push(studentKey);
            } else {
                allStudents[studentKey].email = emailAddress;
            }
        });
    });

    if (leftovers.length > 0) {

        e = new Error("Found " + leftovers.length +" mismatches:", leftovers);
        e.leftovers = leftovers;
        throw e;
    }

    return classroomData;
};
