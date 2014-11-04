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
exports.mergeClassroomAndEmail = function mergeClassroomAndEmail(classroomData, emailData) {
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

/**
 * Using the bits of data between the classroom listing (which is grouped by
 * the classroom number), and the info in the e-mail listing (which is
 * grouped by the teacher's name), try to figure out which teacher is in
 * which classroom (based on the students that overlap).
 * Returns an object that contains the classroom number as property-keys,
 * with the teacher name as the value.
 */
exports.resolveTeachers = function resolveTeachers(classroomData, emailData) {
    // contains the info about the teachers, like 123 : Theodor Seuss Geisel
    var teachers = {};

    // big ol' temporary map of students, to calculate the intersect between
    //    the two bits of information that we have.
    var allStudents = {};
    lodash.forOwn(classroomData, function(value, key, object) {
        lodash.forOwn(value.students, function(studentInfo, studentKey) {
            if (allStudents[studentKey]) {
                throw new Error("Duplicate student key: " + studentKey);
            }
            allStudents[studentKey] = { room: value.room };
        });
    });

    lodash.forOwn(emailData, function(value, key, object) {
        lodash.forOwn(value.students, function(emailAddress, studentKey) {
            allStudents[studentKey].teacher = value.teacher;
        });
    });

    // At this point, we have have enough information to make a
    //    "reasonable guess" regarding which teacher is in which classroom.
    lodash.forOwn(allStudents, function(value, key) {
        var room = value.room;
        var teacher = value.teacher;
        if (!room  ||  !teacher) {
            // this record isn't much help.
            return;
        }
        if (!teachers[room]) {
            // create a new object for this room number
            teachers[room] = {};
        }
        // Keep a count of how many student records claim a specific
        //    teacher is in their classroom. Ideally, there should be 100%
        //    matches here.
        if (!teachers[room][teacher]) {
            teachers[room][teacher] = 0;
        }
        teachers[room][teacher] ++;
    });

    // At this point, we'd want to run some stats 'n' stuff to determine
    //    which teacher is "The correct one" for a given classroom.
    //    At the moment, the stats are consistent enough that I don't
    //    have to code this up right now (whew!)

    var resolvedTeachers = {};
    lodash.forOwn(teachers, function(value, key) {
        resolvedTeachers[key] = lodash.keys(value)[0];
    });
    return resolvedTeachers;
};
