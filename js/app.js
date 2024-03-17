(() => {
  if (window.icl === undefined) {
    throw "fuck";
  }
  // Magic numbers, templates and constants
  const transitionLength = 0.5,
    transitionString =
      "transform " + transitionLength + "s cubic-bezier(0.65, 0, 0.35, 1)",
    VERSION = icl.templateFromID("template-version"),
    BACK_BUTTON = icl.templateFromID("template-back-button"),
    WINDOW_START = icl.templateFromID("template-window-start"),
    WINDOW_END = icl.templateFromID("template-window-end"),
    CLASS_DETAILS = icl.templateFromID("template-class-details"),
    INSTRUCTOR = icl.templateFromID("template-instructor"),
    SEARCH_RESULT = icl.templateFromID("template-search-result"),
    SEARCH = icl.templateFromID("template-search"),
    WEEKDAY_HEADER = icl.templateFromID("template-weekday-header"),
    SCHEDULE_CONTAINER = icl.templateFromID("template-schedule-container"),
    SCHEDULE_VIEW = icl.templateFromID("template-schedule-view"),
    CLASS_ROW = icl.templateFromID("template-class-row"),
    BORDER_ROW = icl.templateFromID("template-border-row"),
    EMPTY_ROW = icl.templateFromID("template-empty-row"),
    TIME_CELL_ROW = icl.templateFromID("template-time-cell-row"),
    INFO_ICON = icl.templateFromID("template-info-icon"),
    GENERAL_ASSIGNMENT_ICON = icl.templateFromID(
      "template-general-assignment-icon",
    ),
    CLASS_ROW_INSTRUCTOR_LINK = icl.templateFromID(
      "template-class-row-instructor-link",
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
    numRows = (endTime - startTime) / 10,
    currentDate = new Date(),
    currentHours = currentDate.getHours(),
    currentMinutes = currentDate.getMinutes(),
    currentTotalMinutes = 60 * currentHours + currentMinutes,
    currentMinutesAfterStart =
      10 * Math.floor(currentTotalMinutes / 10) - startTime,
    currentTimeIndex = currentMinutesAfterStart / 10,
    // Context management
    windowStack = [],
    // Manage back buttons and window state
    windowChangeAnimation = {
      isAnimating: false,
      reportAnimationStart: () => {
        windowStack.forEach(
          (stackElement) =>
            (stackElement.$el.style.transition = transitionString),
        );
        windowChangeAnimation.isAnimating = true;
        disableBackButtons();
      },
      reportAnimationFinish: () => {
        windowChangeAnimation.isAnimating = false;
        windowStack.forEach(
          (stackElement) => (stackElement.$el.style.transition = "none"),
        );

        // prevent the same "onDoneAnimating from being called twice"
        if (typeof windowChangeAnimation.onDoneAnimating == "function") {
          enableBackButtons();
          windowChangeAnimation.onDoneAnimating();
          delete windowChangeAnimation.onDoneAnimating;
        }
      },
    },
    pushToStack = ($el, anchor, offscreenCallback) => {
      // Make it ✨asynchronous
      return new Promise((resolve) => {
        windowChangeAnimation.reportAnimationStart();
        const width = getWidth();
        if (windowStack.length > 0)
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
          windowStack.push({ isOffscreen: false, anchor: anchor, $el: $el });
          // Set stuff that's offscreen to be offscreen
          const stackSize = windowStack.length;
          if (windowStack.length > 1)
            windowStack[stackSize - 2].isOffscreen = true;
          // Move stuff around
          windowStack.forEach((stackItem, i) => {
            const coefficient = stackSize - i - 1,
              translation = -1 * coefficient * width;
            stackItem.$el.style.transition = transitionString;
            stackItem.$el.style.transform = "translateX(" + translation + "vw)";
          });
          // Enable the back buttons when it's all joever
          setTimeout(() => {
            windowChangeAnimation.reportAnimationFinish();
            return resolve();
          }, transitionLength * 1100);
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
        if (windowStack.length < 2)
          // what the fuck
          return reject();
        // Disable the back buttons
        windowChangeAnimation.reportAnimationStart();
        // I did this by pixel size initially but it's by vw units now because I realised it was dumb
        const width = getWidth(),
          // Get the item we're removing
          stackItem = windowStack.pop(),
          $el = stackItem.$el,
          // This will be the current size because pop removed the item from the stack already
          stackSize = windowStack.length;

        // Move the element off to the right
        $el.style.transform = "translateX(" + width + "vw)";
        // Make the element to the left know it's not offscreen
        windowStack[stackSize - 1].isOffscreen = false;
        // Move everything 100vw to the right (1 screen width)
        windowStack.forEach((stackItem, i) => {
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
        windowStack.forEach(
          (stackItem) => (stackItem.$el.style.transition = transitionString),
        );
        // Reject if the anchor dne
        if (!windowStack.some((stackItem) => stackItem.anchor === anchor)) {
          windowStack.forEach(
            (stackItem) => (stackItem.$el.style.transition = "none"),
          );

          return reject();
        }
        // Done if we're here already
        if (windowStack[windowStack.length - 1].anchor === anchor) {
          windowStack.forEach(
            (stackItem) => (stackItem.$el.style.transition = "none"),
          );
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
      .defaultArray(numRows)
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
      .defaultArray(numRows)
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
      var scheduleBlock = icl.defaultArray(numRows, false);
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
          .defaultArray(numRows)
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
                // List all instructors with Blink links
                instructors:
                  meeting.instructors.length == 0
                    ? "No listed instructors."
                    : meeting.instructors
                        .map((instructor) =>
                          CLASS_ROW_INSTRUCTOR_LINK({
                            instructor: instructor,
                            link: icl.instructorLink(instructor),
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
            // If there are no instructors, say so. Otherwise, generate links to Blink
            instructors:
              classObject.instructors.length == 0
                ? "No listed instructors."
                : classObject.instructors
                    .map((instructor) =>
                      INSTRUCTOR({
                        instructor: instructor,
                        link: icl.instructorLink(instructor),
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
        // Get meeting time relative to now
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
        // Get the class that's now
        currentClass = (
          meetingRelativity.filter(
            (relativity) => !relativity.inPast && !relativity.inFuture,
          )[0] || { info: undefined }
        ).info,
        // Get the LAST class in the past
        prevClass = (
          meetingRelativity
            .filter((relativity) => relativity.inPast)
            .slice(-1)[0] || { info: undefined }
        ).info,
        // Get the FIRST class in the future
        nextClass = (
          meetingRelativity.filter((relativity) => relativity.inFuture)[0] || {
            info: undefined,
          }
        ).info,
        daysOfWeek = icl.dateUtil.daysOfWeek,
        scheduleDay = icl.dateUtil.getScheduleDay(date),
        scheduleArgs = {
          windowStart: WINDOW_START({
            uid: generateUID(),
            backButton: BACK_BUTTON(),
            title: room,
          }),
          scheduleLines: scheduleLines,
          windowEnd: WINDOW_END(),
          timeIncrements: timeIncrements,
          prevClass: generateClassDetails(prevClass),
          currentClass: generateClassDetails(currentClass),
          nextClass: generateClassDetails(nextClass),
          weekdayHeaders: daysOfWeek
            .map((dayOfWeek, dayIndex) =>
              WEEKDAY_HEADER({
                isCurrentDay:
                  scheduleDay == dayIndex + 1 ? "" : "not-current-day",
                readableDay: dayOfWeek[0].toUpperCase() + dayOfWeek.slice(1),
              }),
            )
            .join(""),
          scheduleContainers: daysOfWeek
            .map((_, dayIndex) =>
              SCHEDULE_CONTAINER({
                isCurrentDay:
                  scheduleDay == dayIndex + 1 ? "" : "not-current-day",
                scheduleLines: scheduleLines,
                daySchedule: renderDaySchedule(
                  weekSchedule[dayIndex],
                  scheduleDay == dayIndex + 1,
                ),
              }),
            )
            .join(""),
        };
      icl.log(roomMeetings);
      icl.log(weekSchedule);
      scheduleWindow = SCHEDULE_VIEW(scheduleArgs);
      createAndPushToStack(scheduleWindow, "/room/" + room);
    },
    iconForRoom = (room) =>
      room == "APM1313"
        ? INFO_ICON()
        : gaClassrooms.includes(room)
          ? GENERAL_ASSIGNMENT_ICON()
          : "",
    handleSearch = ($searchBox, $searchResultsList) => {
      // Make sure the search is a valid room code or subset.
      const search = $searchBox.value.toUpperCase().replace(/[^A-Z0-9]+/g, "");
      // Hard disallow of anything other than letters, numbers
      $searchBox.value = search;
      // Only run non-empty searches
      if (search.trim().length >= 1) {
        const searchResults = icl.search(search, rooms),
          searchResultHTML = searchResults
            .map((room) =>
              SEARCH_RESULT({
                room: room,
                schedulePreview: "",
                isNonGA: iconForRoom(room),
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
            rooms = classroomsParsed.rooms,
            epoch = classroomsParsed.epoch,
            term = (classroomsParsed.crawlData || "(unknown) ").split(" ")[0];

          var crawlDate = new Date();
          crawlDate.setTime(parseInt(epoch));

          document.getElementById("data-version-container").innerHTML = VERSION(
            {
              term: term,
              dateCrawled: icl.dateUtil.getHumanReadableDate(crawlDate),
            },
          );

          // Load classroom data into global variable
          window.rooms = rooms;
          window.gaClassrooms = gaClassroomList;
          window.classroomsParsed = classroomsParsed;

          window.onhashchange = () => {
            const runHashChange = () => {
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
            icl.log(windowChangeAnimation.isAnimating);
            windowChangeAnimation.isAnimating
              ? (windowChangeAnimation.onDoneAnimating = () => runHashChange())
              : runHashChange();
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

            // Set event handler and focus search box for quick use
            $searchBox.oninput = () =>
              handleSearch($searchBox, $searchResultsList);
            $searchBox.focus();
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
