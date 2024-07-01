// Line types:

// Class definition (no URL)
// EMED296  Independent Reseach
// ^ Course code [9]
//          ^ Title [*]

// Class definition (URL)
// EDS 380A SS Internship Seminar I	/courses/EDS.html#eds380a
// ^ Course code [9]
//          ^ Title [*]
//                                         ^URL [*]

// Section definition
// :A00Erik Norman,Carlson
// ^ Marker for whether the section has exams (: / . / ' / ) [1]
//  ^ Section number [3]
//     ^ Professor name [*]

// Recurring meeting (Capacity)
// 0050WLH  24   LE2207 14001520C00
// ^ Capacity [4]
//     ^ Building code [5]
//          ^ Meeting days [5]
//               ^ Meeting type [2]
//                 ^ Room number [5]
//                      ^ Start time [4]
//                          ^ End time [4]
//                              ^ Section code [4]

// Recurring meeting (no Capacity)
// YORK 135  LE2622 15001550A00
// ^ Building code [5]
//      ^ Meeting days [5]
//           ^ Meeting type [2]
//             ^ Room number [5]
//                  ^ Start time [4]
//                      ^ End time [4]
//                          ^ Section code [4]

// Event
// 20231214TBA  FITBA  15001759
// ^ Date [8]
//         ^ Building [5]
//              ^ Event type [2]
//                ^ Room number [5]
//                     ^ Start time [4]
//                         ^ End time [4]

(() => {
  const allCaps = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    parseClassrooms = (classroomsContent) => {
      // Trim whitespace around content (just in case :))
      var classroomsContentTrimmed = classroomsContent.trim(),
        // Split into lines
        classroomsContentLines = classroomsContentTrimmed
          .split("\n")
          .filter((line) => line.trim().slice(0, 1) != "#"),
        meta = classroomsContentLines.shift(),
        // Get the version number. I have no idea what this means but it should probably be V3 :)
        version = meta.slice(0, 2),
        epoch = meta.slice(2).trim(),
        crawlData = null,
        // Create empty classes array
        classes = [],
        // Create empty rooms object, indexed by code
        rooms = {},
        // Create errors object to handle errors
        errors = [];
      //

      if (version.trim().toUpperCase() !== "V3") {
        throw "fuck";
      }
      classroomsContentLines.forEach((line) => {
        // icl.log(line);
        try {
          // Get current class (most recent) index
          var classIdx = classes.length - 1;
          // Detect new class header
          if (/[A-Z]/.test(line.slice(0, 1)) && line.toUpperCase() !== line) {
            icl.log("Class code");
            if (classIdx === -1) {
              crawlData = line;
            }
            // Add an empty class
            classes.push({
              code: line.slice(0, 9).replaceAll(" ", ""),
              sectionLines: [],
              sectionData: [],
            });
            // Break
            return;
          } else {
            // Parse the line(s) (some are missing newlines at the end, so we can handle that recursively through recursion
            icl.log("Recursively parsing");
            const parsedLineData = parseLineRecursive(line, [], classIdx == 0);
            // Because we can have one or more, we need to add all of them in sequence
            parsedLineData.forEach((lineData) =>
              classes[classIdx].sectionLines.push(lineData),
            );
          }
        } catch (exception) {
          errors.push({
            exception: exception,
            data: {
              line: line,
            },
          });
        }
      });
      // For each class that we have the line data
      classes = classes.map((classObject) => {
        // For each line we've found
        classObject.sectionLines.forEach((lineData) => {
          // Get the most recent section
          var sectionIdx = classObject.sectionData.length - 1;
          // If this is a section definition
          if (lineData.type == "sectionDefinition") {
            // Create an empty section
            classObject.sectionData.push({
              meta: lineData,
              meetings: [],
            });
          } else {
            // Push the meeting to the individual section
            try {
              classObject.sectionData[sectionIdx].meetings.push(lineData);
            } catch (exception) {
              errors.push({
                exception: exception,
                data: {
                  lineData: lineData,
                  classObject: classObject,
                },
              });
            }
          }
        });
        return classObject;
      });
      classes.forEach((classObject) => {
        const course = classObject.code;
        // For each section we've found
        classObject.sectionData.forEach((sectionData) => {
          try {
            // Get the instructor name from the section
            const instructorName = sectionData.meta.instructorName;
            // Get each meeting for the section
            sectionData.meetings.forEach((meeting) => {
              // Get all necessary properties to build object
              const room = meeting.building + meeting.room,
                meetingType = meeting.meetingType,
                start = meeting.start,
                end = meeting.end,
                type = meeting.type,
                meetingObject = {
                  instructors:
                    instructorName == ""
                      ? []
                      : processProfessorName(instructorName),
                  start: start,
                  end: end,
                  type: type,
                  meetingType: meetingType,
                  course: course,
                };
              if (meeting.type == "event") {
                // Event
                meetingObject.date = meeting.date;
              } else {
                // Recurring meeting
                meetingObject.days = meeting.meetingDays;
              }
              // Create empty room in output object if it does not exist
              if (!Object.keys(rooms).some((key) => key == room)) {
                rooms[room] = [];
              }

              rooms[room].push(meetingObject);
            });
          } catch (exception) {
            errors.push({
              exception: exception,
              data: {
                sectionData: sectionData,
              },
            });
          }
        });
      });
      return {
        classes: classes,
        rooms: rooms,
        errors: errors,
        // For "Last updated" in footer
        epoch: epoch,
        // For current term in footer
        currentTerm: (crawlData || "(unknown) ").split(" ")[0],
      };
    },
    parseLineRecursive = (line, returnValue, isData) => {
      icl.log("R> " + line);
      // Create returnValue array
      if (!(returnValue instanceof Array)) {
        returnValue = [];
      }
      // line = line.trim();
      // Determine line type from the beginning
      const lineLengths = {
        recurringNoCapacity: 5 + 5 + 2 + 5 + 4 + 4 + 3,
        recurringCapacity: 4 + 5 + 5 + 2 + 5 + 4 + 4 + 4 + 3,
        event: 8 + 5 + 2 + 5 + 4 + 4,
        sectionDefinition: 1 + 3 + 9999,
      };
      var lineType =
        // Detect events
        line.slice(0, 2) === "20"
          ? "event"
          : // Detect recurring meetings with no capacity
            allCaps.includes(line.slice(0, 1))
            ? "recurringNoCapacity"
            : // Detect TBA recurring (for line length, this will be discarded later)
              line.includes("TBA") &&
                (line.slice(0, 4) === "0000" || line.slice(0, 4) === "9999")
              ? "recurringCapacity"
              : // Detect section number + section (section can be in the form of A00 or 000, so look for two numbers)
                !isNaN(parseInt(line.slice(0, 4))) &&
                  !isNaN(parseInt(line.slice(0, 1)))
                ? "recurringCapacity"
                : "sectionDefinition";

      icl.log("R> " + lineType);

      // Handle section definitions: These universally have \n after and so we do not need to worry about recursion.
      // They also don't have a defined line length
      if (lineType == "sectionDefinition") {
        // ? + Section code + Professor name
        returnValue.unshift({
          type: "sectionDefinition",
          sectionCode: line.slice(1, 4).trim(),
          instructorName: line.slice(4).trim(),
        });
        icl.log("R.sectionDefinition> " + JSON.stringify(returnValue[0]));
        return returnValue;
      } else {
        // Recurse based on the proper line length.
        const correctLength = lineLengths[lineType];
        icl.log("R.length > " + line.length);
        icl.log("R.correctLength > " + correctLength + " (" + lineType + ")");
        icl.log("R.line > " + line.slice(correctLength));
        if (line.length > correctLength) {
          // Parse the rest of it
          parseLineRecursive(line.slice(correctLength), returnValue);
          // Cut line to correct length
          line = line.slice(0, correctLength);
          icl.log("R.slice result> " + line);
        }
      }

      // TBA creature
      if (
        line.includes("TBA") ||
        // Don't show recurring meetings during finals week
        (icl.finals && lineType.includes("recurring") && !isData)
      ) {
        icl.log("TBA Creature triggered with line " + line);
        return returnValue;
      } else if (lineType == "event") {
        // Date + Building + Meeting type + Room + Time
        returnValue.unshift({
          type: "event",
          date: line.slice(0, 8).trim(),
          building: line.slice(8, 13).trim(),
          meetingType: line.slice(13, 15).trim(),
          room: line.slice(15, 20).trim(),
          start: line.slice(20, 24).trim(),
          end: line.slice(24, 28).trim(),
        });
        icl.log("R.event> " + JSON.stringify(returnValue[0]));
        return returnValue;
      } else if (lineType == "recurringCapacity") {
        // Recurring section: Cut off the first 4 characters and parse as "no capacity"
        lineType = "recurringNoCapacity";
        line = line.slice(4);
        icl.log("R.recurringCapacity, slicing> ");
      }
      //Building + Meeting days + Meeting type + Room + Time
      if (lineType == "recurringNoCapacity") {
        icl.log("R.recurringNoCapacity > " + line);
        returnValue.unshift({
          type: "recurring",
          building: line.slice(0, 5).trim(),
          meetingDays: line.slice(5, 10).trim(),
          meetingType: line.slice(10, 12).trim(),
          room: line.slice(12, 17).trim(),
          start: line.slice(17, 21).trim(),
          end: line.slice(21, 25).trim(),
        });
        icl.log("R.recurringNoCapacity, " + JSON.stringify(returnValue[0]));

        return returnValue;
      }
    },
    processProfessorName = (name) =>
      name
        .split("\t")
        .map(
          (name) => name.split(",")[0].split(" ")[0] + " " + name.split(",")[1],
        );

  // Export
  window.icl.parseClassrooms = parseClassrooms;
})();
