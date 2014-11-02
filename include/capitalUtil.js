/**
 *  Attempts to deal with some of the crazy, inconsistent, and funky
 *     capitalization "rules" encountered within the English language
 *     (yeah, I know - good luck with that)
 */

/**
 * Blatantly capitalizes the first character, and lowercases the rest.
 */
exports.capitalizeFirst = function(s) {
    if (!s) {
        return '';
    }
    if (s.length < 2) {
        return s.toUpperCase();
    }

    return s.charAt(0).toUpperCase() + s.substring(1).toLowerCase();
};


/**
 * Tries to make an "educated guess" about how the given string should
 * be formatted.
 */
exports.maybeCapitalizeFirst = function(s) {
    if (!s) {
        return '';
    }

    if (s.indexOf(' ') > -1) {
        // break it apart and treat each word individually
        var pieces = s.split(' ');
        return pieces.map(exports.maybeCapitalizeFirst).join(' ');
    }

    if (s.length == 2) {
        // Assume it's an abbreviation, like "NW", "SE", etc.
        return s;
    }

    return exports.capitalizeFirst(s);
};

/**
 * Wraps the specified string in a set of double quotes. Ideally, it
 * should internally escape any double quotes that exist within the
 * string passed in.
 */
exports.doubleQuote = function(s) {
    return '"' + s + '"';
};
