(() => {
  if (window.icl === undefined) {
    throw "fuck";
  }
  // Magic numbers, templates and constants
  const transitionLength = 0.5,
    transitionString = 'transform ' + transitionLength + 's cubic-bezier(0.65, 0, 0.35, 1)',
    BACK_BUTTON = icl.templateFromID('template-back-button'),
    WINDOW_START = icl.templateFromID('template-window-start'),
    WINDOW_END = icl.templateFromID('template-window-end'),
    CURRENT_CLASS = icl.templateFromID('template-current-class'),
    PROFESSOR = icl.templateFromID('template-professor'),
    SEARCH_RESULT = icl.templateFromID('template-search-result'),
    SEARCH = icl.templateFromID('template-search'),
    SCHEDULE_VIEW = icl.templateFromID('template-schedule-view'),
    CLASS_ROW = icl.templateFromID('template-class-row'),
    NO_SCHEDULED_CLASSES = icl.templateFromID('template-no-scheduled-classes'),
    CLASS_ROW_PROFESSOR_LINK = icl.templateFromID('template-class-row-professor-link'),
    $container = document.getElementById('container'),
    // Utility functions
    generateUID = () => ('' + new Date().getTime()).slice(-6),
    getWidth = () => 100,
    // Context management
    stack = [],
    // Manage back buttons
    windowChangeAnimation = {
      isAnimating: false,
      reportAnimationStart: () => {
        isAnimating = true;
        disableBackButtons();
      },
      reportAnimationFinish: () => {
        isAnimating = false;
        if (typeof this.onDoneAnimating == 'function') {
          enableBackButtons();
          this.onDoneAnimating();
          delete this.onDoneAnimating;
        }
      }
    },
    pushToStack = ($el, anchor, offscreenCallback) => {

      // Make it ✨asynchronous
      return new Promise((resolve, reject) => {
        windowChangeAnimation.reportAnimationStart();
        const width = getWidth();
        $el.style.transition = 'none';
        if (stack.length > 0)
          $el.style.transform = 'translateX(' + width + 'vw)';
        $el.style.transition = transitionString;
        if ($el.classList.contains('window-newly-added')) {
          $el.classList.remove('window-newly-added');
        }
        // We need to delay setting the translation to zero by like 100ms to stop it from glitching lmfao
        setTimeout(() => {
          // Run the "offscreen callback" if it exists
          if (offscreenCallback && typeof offscreenCallback == 'function')
            offscreenCallback();
          // Add the element to the stack
          stack.push({ isOffscreen: false, anchor: anchor, $el: $el });
          // Set stuff that's offscreen to be offscreen
          const stackSize = stack.length;
          if (stack.length > 1)
            stack[stackSize - 2].isOffscreen = true;
          // Move stuff around
          stack.forEach((stackItem, i) => {
            const coefficient = (stackSize - i) - 1,
              translation = ((-1 * coefficient) * width);
            stackItem.$el.style.transform = 'translateX('
              + translation
              + 'vw)';
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
      const $dummyContainer = document.createElement('div');

      // Create the element
      $dummyContainer.innerHTML = elContent;
      const $dummyEl = $dummyContainer.children[0];

      // Move the element onto the container and delete the dummy
      const $el = $container.appendChild($dummyEl);
      $dummyContainer.remove();

      // Push to the stack
      return pushToStack($el, anchor, () => {
        if (offscreenCallback && typeof offscreenCallback == 'function')
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
        $el.style.transform = 'translateX(' + width + 'vw)';
        // Make the element to the left know it's not offscreen
        stack[stackSize - 1].isOffscreen = false;
        // Move everything 100vw to the right (1 screen width)
        stack.forEach((stackItem, i) => {
          // haha math
          const coefficient = (stackSize - i) - 1;
          stackItem.$el.style.transform = 'translateX('
            + (-1 * coefficient * width)
            + 'vw)';
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
        document.querySelectorAll('.back-button'),
        ($button) => $button.disabled = true
      ),
    // Enable all the back buttons
    enableBackButtons = () => [].forEach.call(
      document.querySelectorAll('.back-button'),
      ($button) => $button.disabled = false
    ),
    // Table of hourly time increments from 8:00AM to 7:30 PM
    timeIncrements = Array.apply(null, { length: (19.5 - 8) * 6 }).map((_, i) => {
      // Goofy math
      const minutes = ((i % 6) * 10) + '',
        hours = (8 + Math.floor(i / 6)) + '',
        time = (hours.padStart(2, 0) + ':' + minutes.padStart(2, 0));
      // If there's an hour, put one in the table
      if (i % 6 == 0) {
        return '<tr><td class="noborder">' + time + '</td></tr>';
      } else {
        return '<tr></tr>'
      }
    }).join(''),
    // Render the schedule for a day
    renderDaySchedule = (schedule) => schedule.length > 0 ? (
      '<tbody>' + Array.apply(null, { length: (19.5 - 8) * 6 }).map((_, i) => {
        const minutes = (i % 6) * 10,
          hours = 8 + Math.floor(i / 6),
          time = ('' + (hours * 1e2 + minutes)).padStart(4, 0);

        if (schedule.length > 0 && schedule[0].start === time) {
          const meeting = schedule.shift();
          var course = meeting.course;
          while (schedule.length > 0 && schedule[0].start === time) {
            course += ' / ' + schedule.shift().course;
          }
          return CLASS_ROW({
            length: (meeting.length / 10) + '',
            course: course,
            meetingType: meeting.meetingType,
            start: meeting.start,
            end: meeting.end,
            professors: meeting.professors.map((professor) =>
              CLASS_ROW_PROFESSOR_LINK({ professor: professor, link: professorLink(professor) })
            ).join(' / ')
          });
        } else {
          return '<tr></tr>'
        }
      }).join('') + '</tbody>'
    ) : (
      NO_SCHEDULED_CLASSES()
    ),
    // Open a window with the given schedule
    openSchedule = (rooms, room) => {
      const roomMeetings = rooms[room],
        date = new Date(),
        weekSchedule = icl.dateUtil.getWeekSchedule(roomMeetings, date),
        daySchedule = icl.dateUtil.getDaySchedule(roomMeetings, date),
        currentClass = daySchedule.filter((meeting) => {
          const start = parseInt(meeting.start.slice(0, 2)) * 60 + parseInt(meeting.start.slice(2)),
            end = parseInt(meeting.end.slice(0, 2)) * 60 + parseInt(meeting.end.slice(2)),
            currentTime = date.getHours() * 60 + date.getMinutes();
          return currentTime >= start && currentTime < end;
        })[0],
        scheduleArgs = {
          'windowStart': WINDOW_START({
            'uid': generateUID(),
            'backButton': BACK_BUTTON(),
            'title': room
          }),
          'windowEnd': WINDOW_END(),
          'timeIncrements': '<tbody>' + timeIncrements + '</tbody>',
          'currentClass': currentClass ? CURRENT_CLASS(
            {
              courseCode: currentClass.course,
              professors: currentClass.professors.map(
                (professor) => PROFESSOR({ professor: professor, link: professorLink(professor) })
              ).join(''),
              classTime: currentClass.start + "-" + currentClass.end,
              meetingType: currentClass.meetingType
            }
          ) : "No class"
        };
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        .forEach((day, i) => {
          scheduleArgs[day + 'Schedule'] = renderDaySchedule(weekSchedule[i]);
          scheduleArgs[day + 'IsCurrentDay'] = (icl.dateUtil.getScheduleDay(date) == i + 1) ? "" : "not-current-day";
        });
      scheduleWindow = SCHEDULE_VIEW(scheduleArgs);
      createAndPushToStack(scheduleWindow, '/room/' + room);
    },
    handleSearch = ($searchBox, $searchResultsList) => {
      const search = $searchBox.value.toUpperCase().replace(/[^A-Z0-9]+/g, '');
      $searchBox.value = search;
      if (search.trim().length >= 2) {
        const searchResults = icl.search(search, rooms).slice(0, 10),
          searchResultHTML = searchResults.map((result) => SEARCH_RESULT(
            { room: result[0], schedulePreview: '' }
          )).join('');
        $searchResultsList.innerHTML = searchResultHTML;
      } else {
        $searchResultsList.innerHTML = '';
      }
    },
    professorLink = (professor) => "https://act.ucsd.edu/directory/search?" +
      "last={{last}}&first={{first}}&searchType=0"
        .replace('{{last}}', professor.split(' ')[1])
        .replace('{{first}}', professor.split(' ')[0]);
  // Load class data
  icl
    .retrieveClassrooms("./source/classrooms-S123.txt")
    .then((classroomContent) => {
      const classroomsParsed = icl.parseClassrooms(classroomContent),
        rooms = classroomsParsed.rooms;

      window.rooms = rooms;

      window.onhashchange = () => {
        const hash = location.hash.replaceAll('#', '');
        popToAnchor(hash).catch(() => {
          //Check if this is caused by clicking to open a schedule
          if (hash.startsWith('/room/')) {
            const room = hash.slice(6).trim();
            if (rooms[room] !== undefined) {
              openSchedule(rooms, room);
            }
          }
        });
      };

      setTimeout(() => window.onhashchange(), 300);

      // Create search window
      const searchWindow = SEARCH({
        'windowStart': WINDOW_START({ backButton: '', uid: generateUID() }),
        'windowEnd': WINDOW_END(),
        'title': ''
      });

      createAndPushToStack(searchWindow, '', ($el) => {
        const $searchBox = $el.querySelector('.search-box'),
          $searchResultsList = $el.querySelector('.search-results');

        $searchBox.oninput = () => handleSearch($searchBox, $searchResultsList);
        $searchBox.focus();
        // window.icl.app.openSchedule = (room) => openSchedule(rooms, room);
      });
    }).catch((error) => {
      throw error;
    });
  // Register event listeners
  window.icl.app = {
    back: () => history.back()
    // openProfessor: (professor) => {
    //   const searchURL = 'https://act.ucsd.edu/directory/search?last={{last}}&first={{first}}&searchType=0'
    //     .replace('{{last}}', professor.split(' ')[1])
    //     .replace('{{first}}', professor.split(' ')[0]);
    //   window.open(searchURL);
    // }
  };
})();
