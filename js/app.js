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
    PROFESSOR = icl.templateFromID('template-professor')
  SEARCH_RESULT = icl.templateFromID('template-search-result'),
    SEARCH = icl.templateFromID('template-search'),
    SCHEDULE_VIEW = icl.templateFromID('template-schedule-view'),

    $container = document.getElementById('container');
  // Utility functions
  const generateUID = () => ('' + new Date().getTime()).slice(-6),
    getWidth = () => 100;
  // Context management
  const stack = [],
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
    pushToStack = ($el, offscreenCallback) => {
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
        setTimeout(() => {
          if (offscreenCallback && typeof offscreenCallback == 'function')
            offscreenCallback();
          stack.push({ isOffscreen: false, $el: $el });
          const stackSize = stack.length;
          if (stack.length > 1)
            stack[stackSize - 2].isOffscreen = true;
          stack.forEach((stackItem, i) => {
            const coefficient = (stackSize - i) - 1,
              translation = ((-1 * coefficient) * width);
            console.log(coefficient);
            console.log('translateX('
              + translation
              + 'vw)');
            stackItem.$el.style.transform = 'translateX('
              + translation
              + 'vw)';
          });
          setTimeout(() => {
            windowChangeAnimation.reportAnimationFinish();
            return resolve();
          }, transitionLength * 1000);
        }, 1);
      });
    },
    createAndPushToStack = (elContent, offscreenCallback) => {
      const $dummyContainer = document.createElement('div');

      $dummyContainer.innerHTML = elContent;
      const $dummyEl = $dummyContainer.children[0];

      const $el = $container.appendChild($dummyEl);
      $dummyContainer.remove();
      return pushToStack($el, () => {
        if (offscreenCallback && typeof offscreenCallback == 'function')
          offscreenCallback($el);
      });
    },
    popFromStack = () => {
      return new Promise((resolve, reject) => {
        windowChangeAnimation.reportAnimationStart();
        const width = getWidth(),
          stackItem = stack.pop(),
          $el = stackItem.$el,
          stackSize = stack.length;
        $el.style.transform = 'translateX(' + width + 'vw)';
        stack[stackSize - 1].isOffscreen = false;
        stack.forEach((stackItem, i) => {
          const coefficient = (stackSize - i) - 1;
          stackItem.$el.style.transform = 'translateX('
            + (-1 * coefficient * width)
            + 'vw)';
        });
        setTimeout(() => {
          windowChangeAnimation.reportAnimationFinish();
          $el.remove();
          return resolve();
        }, transitionLength * 1000);
      });
    },
    disableBackButtons = () =>
      [].forEach.call(
        document.querySelectorAll('.back-button'),
        ($button) => $button.disabled = true
      ),
    enableBackButtons = () => [].forEach.call(
      document.querySelectorAll('.back-button'),
      ($button) => $button.disabled = false
    );
  // Load class data
  icl
    .retrieveClassrooms("./source/classrooms-SP23.txt")
    .then((classroomContent) => {
      const classroomsParsed = icl.parseClassrooms(classroomContent),
        rooms = classroomsParsed.rooms;

      window.rooms = rooms;

      // Create search window
      const searchWindow = SEARCH({
        'windowStart': WINDOW_START({ backButton: '', uid: generateUID() }),
        'windowEnd': WINDOW_END(),
      });

      createAndPushToStack(searchWindow, ($el) => {
        const $searchBox = $el.querySelector('.search-box'),
          $searchResultsList = $el.querySelector('.search-results');

        $searchBox.focus();
        $searchBox.oninput = () => {
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
        }

        const timeIncrements = Array.apply(null, { length: (19.5 - 8) * 6 }).map((_, i) => {
          const minutes = ((i % 6) * 10) + '',
            hours = (8 + Math.floor(i / 6)) + '',
            time = (hours.padStart(2, 0) + ':' + minutes.padStart(2, 0));
          if (i % 6 == 0) {
            return '<tr><td class="noborder">' + time + '</td></tr>';
          } else {
            return '<tr></tr>'
          }
        }).join(''),
          renderDaySchedule = (schedule) => schedule.length > 0 ? (
            '<tbody>' + Array.apply(null, { length: (19.5 - 8) * 6 }).map((_, i) => {
              const minutes = (i % 6) * 10,
                hours = 8 + Math.floor(i / 6),
                time = ('' + (hours * 1e2 + minutes)).padStart(4, 0);
              if (schedule.length > 0 && schedule[0].start === time) {
                const meeting = schedule.shift();
                console.log(meeting);
                return '<tr><td rowspan=' + (meeting.length / 10) + '>'
                  + meeting.course + " " + meeting.meetingType + " | "
                  + meeting.start + "-" + meeting.end + "<br/>"
                  + meeting.professors.map((professorName) =>
                    (
                      "<a href='#' onclick='icl.app.openProfessor(\"{{professor}}\"); return false;'>"
                      + "{{professor}}</a>"
                    ).replaceAll('{{professor}}', professorName)
                  ).join('<br/>')
                  + '</td></tr>';
              } else {
                return '<tr></tr>'
              }
            }).join('') + '</tbody>'
          ) : (
            '<tbody><tr><td class="noborder">No scheduled classes</td></tr></tbody>'
          );


        window.icl.app.openSchedule = (room) => {
          const roomMeetings = rooms[room],
            date = new Date(),
            weekSchedule = icl.dateUtil.getWeekSchedule(roomMeetings, date),
            daySchedule = icl.dateUtil.getDaySchedule(roomMeetings, date),
            currentClass = daySchedule.filter((meeting) => {
              const start = parseInt(meeting.start.slice(0, 2)) * 60 + parseInt(meeting.start.slice(2)),
                end = parseInt(meeting.end.slice(0, 2)) * 60 + parseInt(meeting.end.slice(2)),
                currentTime = date.getHours() * 60 + date.getMinutes();
              console.log(start, end, currentTime);
              return currentTime >= start && currentTime < end;
            })[0],
            scheduleArgs = {
              'windowStart': WINDOW_START({
                'uid': generateUID(),
                'backButton': BACK_BUTTON()
              }),
              'windowEnd': WINDOW_END(),
              'timeIncrements': '<tbody>' + timeIncrements + '</tbody>',
              'currentClass': currentClass ? CURRENT_CLASS(
                {
                  courseCode: currentClass.course,
                  professors: currentClass.professors.map(
                    (professor) => PROFESSOR({ professor: professor })
                  ).join(''),
                  classTime: currentClass.start + "-" + currentClass.end,
                  meetingType: currentClass.meetingType
                }
              ) : "No class"
            };
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            .forEach((day, i) => {
              scheduleArgs[day + 'Schedule'] = renderDaySchedule(weekSchedule[i]);
            });
          scheduleWindow = SCHEDULE_VIEW(scheduleArgs);
          createAndPushToStack(scheduleWindow);
        };
      });
    }).catch((error) => {
      throw error;
    });
  // Register event listeners
  window.icl.app = {
    back: () => popFromStack(),
    openProfessor: (professor) => {
      const searchURL = 'https://act.ucsd.edu/directory/search?last={{last}}&first={{first}}&searchType=0'
        .replace('{{last}}', professor.split(' ')[1])
        .replace('{{first}}', professor.split(' ')[0]);
      window.open(searchURL);
    }
  };
})();
