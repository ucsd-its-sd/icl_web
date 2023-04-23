(() => {
  const allCaps = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    parseClassrooms = (classroomsContent) => {
      // Trim whitespace around content (just in case :))
      var classroomsContentTrimmed = classroomsContent.trim(),
        // Split into lines
        classroomsContentLines = classroomsContentTrimmed.split('\n'),
        // Get the version number. I have no idea what this means but it should probably be V2 :)
        version = classroomsContentLines.shift(),
        // Create empty classes array
        classes = [],
        // Create empty rooms object, indexed by code
        rooms = {},
        // Create errors object to handle errors
        errors = [];
      //
      if (version.trim().toUpperCase() !== "V2") {
        throw "fuck";
      }
      classroomsContentLines.forEach((line) => {
        try {
          // Get current class (most recent) index
          var classIdx = classes.length - 1
          // Detect new class header
          if (line.slice(0, 1) != '\t') {
            // Add an empty class
            classes.push({
              code: line.slice(0, 9).replaceAll(' ', ''),
              sectionLines: [],
              sectionData: []
            });
            // Break
            return;
          } else {
            // Parse the line(s) (some are missing newlines at the end, so we can handle that recursively through recursion)
            const parsedLineData = parseLineRecursive(line);
            // Because we can have one or more, we need to add all of them in sequence
            parsedLineData.forEach(
              (lineData) => classes[classIdx].sectionLines.push(lineData)
            );
          }
        } catch (exception) {
          errors.push({
            exception: exception,
            data: {
              line: line
            }
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
          if (lineData.type == 'sectionDefinition') {
            // Create an empty section
            classObject.sectionData.push({
              'meta': lineData,
              'meetings': []
            });
          } else {
            // Push the meeting to the individual section
            try {
              classObject.sectionData[sectionIdx].meetings.push(
                lineData
              )
            } catch (exception) {
              errors.push({
                exception: exception,
                data: {
                  lineData: lineData,
                  classObject: classObject
                }
              });
            }
          }
        });
        return classObject
      });
      classes.forEach((classObject) => {
        const course = classObject.code;
        // For each section we've found
        classObject.sectionData.forEach((sectionData) => {
          try {
            // Get the professor name from the section
            const professorName = sectionData.meta.professorName;
            // Get each meeting for the section
            sectionData.meetings.forEach((meeting) => {
              // Get all necessary properties to build object
              const room = meeting.building + meeting.room,
                meetingType = meeting.meetingType,
                start = meeting.start,
                end = meeting.end,
                type = meeting.type,
                meetingObject = {
                  professors: processProfessorName(professorName),
                  start: start,
                  end: end,
                  type: type,
                  meetingType: meetingType,
                  course: course
                };
              if (meeting.type == 'event') {
                // Event
                meetingObject.date = meeting.date;
              } else {
                // Recurring meeting
                meetingObject.days = meeting.meetingDays;
              }
              // Create empty room in output object if it does not exist
              if (!(Object.keys(rooms).some((key) => key == room))) {
                rooms[room] = [];
              }

              rooms[room].push(meetingObject);
            });
          } catch (exception) {
            errors.push({
              exception: exception,
              data: {
                sectionData: sectionData
              }
            });
          }
        });
      });
      return { classes: classes, rooms: rooms, errors: errors };
    },
    parseLineRecursive = (line, returnValue) => {
      // Create returnValue array
      if (!(returnValue instanceof Array)) {
        returnValue = [];
      }
      line = line.trim();
      // Determine line type from the beginning
      const lineLengths = {
        // Building + Meeting days + Meeting type + Room + Time
        recurringNoSection: 5 + 5 + 2 + 5 + 8,
        // Date + Building + Meeting type + Room + Time
        event: 8 + 5 + 2 + 5 + 8,
        // ??? + Section + Building + Meeting days + Meeting type + Room + Time
        recurringSection: 4 + 3 + 5 + 5 + 2 + 5 + 8,
        // 0000 or 9999 + Section + Building + Meeting days  + Meeting type + Room + Time*
        recurringTBA: 4 + 3 + 5 + 5 + 2 + 5 + 7,
        // ? + Section code + Professor name
        sectionDefinition: 1 + 4 + 9999
      };
      var lineType = (
        // Detect events
        line.slice(0, 2) === "20" ? "event" : (
          // Detect recurring meetings with no section
          allCaps.includes(line.slice(0, 1)) ? "recurringNoSection" : (
            // Detect TBA recurring (for line length, this will be discarded later)
            line.includes("TBA") && (line.slice(0, 4) === "0000" || line.slice(0, 4) === "9999") ? "recurringTBA" : (
              (
                // Detect section number + section (section can be in the form of A00 or 000, so look for two numbers)
                !isNaN(parseInt(line.slice(0, 4))) &&
                !isNaN(parseInt(line.slice(5, 7)))
              ) ? "recurringSection" : (
                'sectionDefinition'
              )
            )
          )
        )
      );

      // Handle section definitions: These universally have \n after and so we do not need to worry about recursion.
      // They also don't have a defined line length
      if (lineType == 'sectionDefinition') {
        // ? + Section code + Professor name
        returnValue.unshift({
          type: 'sectionDefinition',
          sectionCode: line.slice(0, 4).trim(),
          professorName: line.slice(4).trim()
        });
        return returnValue;
      } else {
        // Recurse based on the proper line length.
        const correctLength = lineLengths[lineType];
        if (line.length > correctLength) {
          // Parse the rest of it
          parseLineRecursive(line.slice(correctLength), returnValue);
          // Cut line to correct length
          line = line.slice(0, correctLength);
        }
      }

      // TBA creature
      if (line.includes("TBA")) {
        return returnValue;
      } else if (lineType == 'event') {
        // Date + Building + Meeting type + Room + Time
        returnValue.unshift({
          type: 'event',
          date: line.slice(0, 8).trim(),
          building: line.slice(8, 13).trim(),
          meetingType: line.slice(13, 15).trim(),
          room: line.slice(15, 20).trim(),
          start: line.slice(20, 24).trim(),
          end: line.slice(24, 28).trim()
        });
        return returnValue;
      }
      else if (lineType == 'recurringSection') {
        // Recurring section: Cut off the first 7 characters and parse as "no section"
        lineType = 'recurringNoSection';
        line = line.slice(7);
      }
      if (lineType == 'recurringNoSection') {
        returnValue.unshift({
          type: 'recurring',
          building: line.slice(0, 5).trim(),
          meetingDays: line.slice(5, 10).trim(),
          meetingType: line.slice(10, 12).trim(),
          room: line.slice(12, 17).trim(),
          start: line.slice(17, 21).trim(),
          end: line.slice(21, 25).trim()
        });
        return returnValue;
      }
    },
    processProfessorName = (name) => (name.split('\t').map((name) => name.split(',')[0].split(' ')[0] + ' ' + name.split(',')[1]));

  // Export
  window.icl.parseClassrooms = parseClassrooms;
})();
