(() => {
  if (window.icl === undefined) {
    throw "fuck";
  }
  // Magic numbers, templates and constants
  const transitionLength = 0.5,
    transitionString =
      "transform " + transitionLength + "s cubic-bezier(0.65, 0, 0.35, 1)",
    BACK_BUTTON = icl.templateFromID("template-back-button"),
    WINDOW_START = icl.templateFromID("template-window-start"),
    WINDOW_END = icl.templateFromID("template-window-end"),
    CLASS_DETAILS = icl.templateFromID("template-class-details"),
    PROFESSOR = icl.templateFromID("template-professor"),
    SEARCH_RESULT = icl.templateFromID("template-search-result"),
    SEARCH = icl.templateFromID("template-search"),
    SCHEDULE_VIEW = icl.templateFromID("template-schedule-view"),
    CLASS_ROW = icl.templateFromID("template-class-row"),
    BORDER_ROW = icl.templateFromID("template-border-row"),
    EMPTY_ROW = icl.templateFromID("template-empty-row"),
    TIME_CELL_ROW = icl.templateFromID("template-time-cell-row"),
    INFO_ICON = icl.templateFromID("template-info-icon"),
    GEN_ASS_ICON = icl.templateFromID("template-gen-ass-icon"),
    CLASS_ROW_PROFESSOR_LINK = icl.templateFromID(
      "template-class-row-professor-link",
    ),
    $container = document.getElementById("container"),
    // Utility functions
    generateUID = () => ("" + new Date().getTime()).slice(-6),
    getWidth = () => 100,
    // Magic Numbers
    // Start time is 7:00 a.m. for the graph
    startTime = 7 * 60,
    // End time is 11:00 p.m.
    endTime = 23 * 60,
    // Length of graph
    indexTransformer = icl.dateUtil.indexTransformer(startTime),
    graphLength = (endTime - startTime) / 10,
    currentDate = new Date(),
    currentHours = currentDate.getHours(),
    currentMinutes = currentDate.getMinutes(),
    currentTotalMinutes = 60 * currentHours + currentMinutes,
    currentTime = 10 * Math.floor(currentTotalMinutes / 10) - startTime,
    currentTimeIndex = currentTime / 10,
    // Context management
    stack = [],
    // Manage back buttons and window state
    windowChangeAnimation = {
      isAnimating: false,
      reportAnimationStart: () => {
        isAnimating = true;
        disableBackButtons();
      },
      reportAnimationFinish: () => {
        isAnimating = false;
        // prevent the same "onDoneAnimating from being called twice"
        if (typeof this.onDoneAnimating == "function") {
          enableBackButtons();
          this.onDoneAnimating();
          delete this.onDoneAnimating;
        }
      },
    },
    pushToStack = ($el, anchor, offscreenCallback) => {
      // Make it ✨asynchronous
      return new Promise((resolve) => {
        windowChangeAnimation.reportAnimationStart();
        const width = getWidth();
        $el.style.transition = "none";
        if (stack.length > 0)
          $el.style.transform = "translateX(" + width + "vw)";
        $el.style.transition = transitionString;
        if ($el.classList.contains("window-newly-added")) {
          $el.classList.remove("window-newly-added");
        }
        // We need to delay setting the translation to zero by like 100ms to stop it from glitching lmfao
        setTimeout(() => {
          // Run the "offscreen callback" if it exists
          if (offscreenCallback && typeof offscreenCallback == "function")
            offscreenCallback();
          // Add the element to the stack
          stack.push({ isOffscreen: false, anchor: anchor, $el: $el });
          // Set stuff that's offscreen to be offscreen
          const stackSize = stack.length;
          if (stack.length > 1) stack[stackSize - 2].isOffscreen = true;
          // Move stuff around
          stack.forEach((stackItem, i) => {
            const coefficient = stackSize - i - 1,
              translation = -1 * coefficient * width;
            stackItem.$el.style.transform = "translateX(" + translation + "vw)";
          });
          // Enable the back buttons when it's all joever
          setTimeout(() => {
            windowChangeAnimation.reportAnimationFinish();
            return resolve();
          }, transitionLength * 900);
        }, 100);
      });
    },
    // Do the thing above but make the element from an HTML string
    createAndPushToStack = (elContent, anchor, offscreenCallback) => {
      // CHILL, DUMMY
      const $dummyContainer = document.createElement("div");

      // Create the element
      $dummyContainer.innerHTML = elContent;
      const $dummyEl = $dummyContainer.children[0];

      // Move the element onto the container and delete the dummy
      const $el = $container.appendChild($dummyEl);
      $dummyContainer.remove();

      // Push to the stack
      return pushToStack($el, anchor, () => {
        if (offscreenCallback && typeof offscreenCallback == "function")
          offscreenCallback($el);
      });
    },
    // Handle going back
    popFromStack = () => {
      // Make it ✨asynchronous
      return new Promise((resolve, reject) => {
        if (stack.length < 2)
          // what the fuck
          return reject();
        // Disable the back buttons
        windowChangeAnimation.reportAnimationStart();
        // I did this by pixel size initially but it's by vw units now because I realised it was dumb
        const width = getWidth(),
          // Get the item we're removing
          stackItem = stack.pop(),
          $el = stackItem.$el,
          // This will be the current size because pop removed the item from the stack already
          stackSize = stack.length;
        // Move the element off to the right
        $el.style.transform = "translateX(" + width + "vw)";
        // Make the element to the left know it's not offscreen
        stack[stackSize - 1].isOffscreen = false;
        // Move everything 100vw to the right (1 screen width)
        stack.forEach((stackItem, i) => {
          // haha math
          const coefficient = stackSize - i - 1;
          stackItem.$el.style.transform =
            "translateX(" + -1 * coefficient * width + "vw)";
        });
        // Re-enable back buttons when it's joever
        setTimeout(() => {
          windowChangeAnimation.reportAnimationFinish();
          // Delete the element we popped off
          $el.remove();
          return resolve();
        }, transitionLength * 1000);
      });
    },
    // Handle going back
    popToAnchor = (anchor) => {
      // Make it ✨ async
      return new Promise((resolve, reject) => {
        // Reject if the anchor dne
        if (!stack.some((stackItem) => stackItem.anchor === anchor)) {
          return reject();
        }
        // Done if we're here already
        if (stack[stack.length - 1].anchor === anchor) {
          return resolve();
        }
        // DID YOU KNOW YOU CAN DO RECURSION WITH PROMISES? I HATE THIS
        return popFromStack().then(() => popToAnchor(anchor).then(resolve));
      });
    },
    // Disable all the back buttons
    disableBackButtons = () =>
      [].forEach.call(
        document.querySelectorAll(".back-button"),
        ($button) => ($button.disabled = true),
      ),
    // Enable all the back buttons
    enableBackButtons = () =>
      [].forEach.call(
        document.querySelectorAll(".back-button"),
        ($button) => ($button.disabled = false),
      ),
    // Table of hourly time increments from 7:00AM to 11:00 PM
    // Generate empty array and fill its values
    timeIncrements = icl
      .defaultArray(graphLength)
      .map((_, timeIncrementRowIndex) => {
        // Generate time string
        const minutesString = String((timeIncrementRowIndex % 6) * 10).padStart(
            2,
            0,
          ),
          hoursString = String(
            Math.floor((startTime + timeIncrementRowIndex * 10) / 60),
          ).padStart(2, 0),
          time = hoursString + ":" + minutesString.padStart(2, 0);
        // If there's an hour, put one in the table
        if (timeIncrementRowIndex % 6 == 0) {
          return TIME_CELL_ROW({ time: time });
        } else {
          return EMPTY_ROW();
        }
      })
      .join(""),
    // Table of hourly time increments from 7:00AM to 11:00 PM
    scheduleLines = icl
      .defaultArray(graphLength)
      .map((_, scheduleLineIndex) => {
        // Current index
        if (scheduleLineIndex == currentTimeIndex) {
          // Add cell with red line
          return BORDER_ROW({
            current: "current-",
            minWidth: "min-width-datacell",
          });
          // Hour index
        } else if (scheduleLineIndex % 6 == 0) {
          // Add cell with black/white line
          return BORDER_ROW({
            current: "",
            minWidth: "min-width-datacell",
          });
        } else {
          return EMPTY_ROW();
        }
      })
      .join(""),
    // Render the schedule for a day
    renderDaySchedule = (schedule, isToday) => {
      icl.log(JSON.stringify(schedule, null, 2));
      // Make a copy of the schedule to slice and dice
      var copiedSchedule = [].slice.call(schedule);
      // Generate empty array
      var scheduleBlock = icl.defaultArray(graphLength, false);
      // Assemble schedule block
      schedule.forEach((meeting) => {
        const indices = indexTransformer.getMeetingIndices(meeting),
          start = indices.startIndex,
          end = indices.endIndex;
        // Build time blocks for easy lookup
        for (var time = start; time <= end; time++) {
          scheduleBlock[time] = true;
        }
      });
      // Check if a given time is in the schedule
      var isInSchedule = (timeIndex) => scheduleBlock[timeIndex] === true;
      return (
        "<tbody>" +
        icl
          .defaultArray(graphLength)
          .map((_, timeIndex) => {
            icl.log(JSON.stringify(copiedSchedule[timeIndex]));
            const time = indexTransformer.indexToTime(timeIndex);
            if (
              copiedSchedule.length > 0 &&
              copiedSchedule[0].start === time.timeString
            ) {
              const meeting = copiedSchedule.shift(),
                meetingIndices = indexTransformer.getMeetingIndices(meeting),
                isOngoing =
                  isToday &&
                  timeIndex <= currentTimeIndex &&
                  timeIndex + meetingIndices.rowLength >= currentTimeIndex;
              var course = meeting.course;
              // Absorb cross-listed courses
              while (
                copiedSchedule.length > 0 &&
                copiedSchedule[0].start === time.timeString
              ) {
                if (!course.split(" / ").includes(copiedSchedule[0].course))
                  course += " / " + copiedSchedule[0].course;
                copiedSchedule.shift();
              }
              // Build table row
              return CLASS_ROW({
                // Rowspan
                length: String(meetingIndices.rowLength),
                course: course,
                meetingType: meeting.meetingType,
                start: meeting.start,
                end: meeting.end,
                // Get current class styling
                currentClass: isOngoing ? "current-class" : "",
                // Set border styles for hour and current times at top and bottom
                timeBorderClass:
                  (timeIndex == currentTimeIndex
                    ? "current-time-border-datacell"
                    : time.minutes == 0
                      ? "time-border-datacell"
                      : "") +
                  " " +
                  (meetingIndices.endIndex == currentTimeIndex
                    ? "current-time-bottom-border-datacell"
                    : meetingIndices.endIndex % 6 == 0
                      ? "time-bottom-border-datacell"
                      : ""),
                // List all professors with Blink links
                professors:
                  meeting.professors.length == 0
                    ? "No listed instructors."
                    : meeting.professors
                        .map((professor) =>
                          CLASS_ROW_PROFESSOR_LINK({
                            professor: professor,
                            link: icl.professorLink(professor),
                          }),
                        )
                        .join(" / "),
              });
            } else if (isInSchedule(timeIndex)) {
              // We don't want anything during classes at all because any <td> would be appended to the end
              return EMPTY_ROW();
            } else if (timeIndex == currentTimeIndex) {
              // Show current time line
              return BORDER_ROW({ current: "current-", minWidth: "" });
            } else if (time.minutes == 0) {
              // Show hour border line
              return BORDER_ROW({ current: "", minWidth: "" });
            }
            // Return an empty row to keep the table nice and shapely
            return EMPTY_ROW();
          })
          .join("") +
        "</tbody>"
      );
    },
    // Move this outside of the `openSchedule` function
    generateClassDetails = (classObject) =>
      classObject
        ? CLASS_DETAILS({
            courseCode: classObject.course,
            professors:
              classObject.professors.length == 0
                ? "No listed instructors."
                : classObject.professors
                    .map((professor) =>
                      PROFESSOR({
                        professor: professor,
                        link: icl.professorLink(professor),
                      }),
                    )
                    .join(""),
            classTime: classObject.start + "-" + classObject.end,
            meetingType: classObject.meetingType,
          })
        : "No class",
    // Open a window with the given schedule
    openSchedule = (rooms, room) => {
      const roomMeetings = rooms[room],
        date = new Date(),
        weekSchedule = icl.dateUtil.getWeekSchedule(roomMeetings, date),
        daySchedule = icl.dateUtil.getDaySchedule(roomMeetings, date),
        meetingRelativity = daySchedule.map((meeting) => {
          const meetingIndices = indexTransformer.getMeetingIndices(meeting),
            start = meetingIndices.startMinutes,
            end = meetingIndices.endMinutes;
          return {
            inPast: end < currentTotalMinutes,
            inFuture: start > currentTotalMinutes,
            info: meeting,
          };
        }),
        currentClass = (
          meetingRelativity.filter(
            (relativity) => !relativity.inPast && !relativity.inFuture,
          )[0] || { info: undefined }
        ).info,
        prevClass = (
          meetingRelativity
            .filter((relativity) => relativity.inPast)
            .slice(-1)[0] || { info: undefined }
        ).info,
        nextClass = (
          meetingRelativity.filter((relativity) => relativity.inFuture)[0] || {
            info: undefined,
          }
        ).info,
        scheduleArgs = {
          windowStart: WINDOW_START({
            uid: generateUID(),
            backButton: BACK_BUTTON(),
            title: room,
          }),
          scheduleLines: scheduleLines,
          windowEnd: WINDOW_END(),
          timeIncrements: "<tbody>" + timeIncrements + "</tbody>",
          prevClass: generateClassDetails(prevClass),
          currentClass: generateClassDetails(currentClass),
          nextClass: generateClassDetails(nextClass),
        };
      icl.log(roomMeetings);
      icl.log(weekSchedule);
      icl.dateUtil.daysOfWeek.forEach((day, dayIndex) => {
        const isToday = icl.dateUtil.getScheduleDay(date) == dayIndex + 1;
        scheduleArgs[day + "Schedule"] = renderDaySchedule(
          weekSchedule[dayIndex],
          isToday,
        );
        scheduleArgs[day + "IsCurrentDay"] = isToday ? "" : "not-current-day";
      });
      scheduleWindow = SCHEDULE_VIEW(scheduleArgs);
      createAndPushToStack(scheduleWindow, "/room/" + room);
    },
    handleSearch = ($searchBox, $searchResultsList) => {
      const search = $searchBox.value.toUpperCase().replace(/[^A-Z0-9]+/g, "");
      $searchBox.value = search;
      if (search.trim().length >= 1) {
        const searchResults = icl.search(search, rooms),
          searchResultHTML = searchResults
            .map((result) =>
              SEARCH_RESULT({
                room: result[0],
                schedulePreview: "",
                isNonGA:
                  result[0] == "APM1313"
                    ? INFO_ICON()
                    : gaClassrooms.includes(result[0])
                      ? GEN_ASS_ICON()
                      : "",
              }),
            )
            .join("");
        $searchResultsList.innerHTML = searchResultHTML;
      } else {
        $searchResultsList.innerHTML = "";
      }
    };
  // Load class data
  icl
    .retrieveGAClassroomList()
    .then((gaClassroomList) =>
      icl
        .retrieveClassrooms()
        .then((classroomContent) => {
          const classroomsParsed = icl.parseClassrooms(classroomContent),
            rooms = classroomsParsed.rooms;

          window.rooms = rooms;
          window.gaClassrooms = gaClassroomList;

          window.onhashchange = () => {
            const hash = location.hash.replaceAll("#", "");
            popToAnchor(hash).catch(() => {
              //Check if this is caused by clicking to open a schedule
              if (hash.startsWith("/room/")) {
                const room = hash.slice("/room/".length).trim();
                if (rooms[room] !== undefined) {
                  openSchedule(rooms, room);
                }
              }
            });
          };

          setTimeout(() => window.onhashchange(), 300);

          // Create search window
          const searchWindow = SEARCH({
            windowStart: WINDOW_START({ backButton: "", uid: generateUID() }),
            windowEnd: WINDOW_END(),
            title: "",
          });

          createAndPushToStack(searchWindow, "", ($el) => {
            const $searchBox = $el.querySelector(".search-box"),
              $searchResultsList = $el.querySelector(".search-results");

            $searchBox.oninput = () =>
              handleSearch($searchBox, $searchResultsList);
            $searchBox.focus();
            // window.icl.app.openSchedule = (room) => openSchedule(rooms, room);
          });
        })
        .catch((error) => {
          throw error;
        }),
    )
    .catch((error) => {
      throw error;
    });
  // Register event listeners
  window.icl.app = {
    back: () => history.back(),
  };
})();
