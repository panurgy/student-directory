Student Directory Generator
====

Command-Line Node.js app that needs three CSV files:
 - Classroom listing: This CSV file contains the fields:
   - Student last
   - Student first
   - Room
   - Parent last
   - Parent first
   - Street Address
   - City
   - Home number
   - Cell phone
 - Email listing: This CSV file contains the fields:
   - student.lastName
   - student.firstName
   - contacts.email
   - contacts.secondaryEmail
   - student.homeroomTeacher
 - Staff listing: This CSV file contains the fields:
   - Room
   - Position
   - Name
   - Phone
   - Email

Based on all of that information, the application generates a CSV file that contains the following, grouped by classroom:
  - Student Last Name
  - Student First Name
  - Primary Phone (selected from the first non-empty phone number)
  - Primary Address (selected from the first non-empty address)
  - Email address (selected from the first non-empty entry)

After the finished CSV has been generated, it's highly recommended that a human look over the results, because some names have special capitalization rules.

