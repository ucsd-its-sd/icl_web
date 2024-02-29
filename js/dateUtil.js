(() => {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDay
  const getScheduleDay = (date) => date.getDay(),
    // Generate date string in format YYYYMMDD (same as used in the classroom data)
    getScheduleDateString = (date) =>
      String(
        date.getFullYear() * 1e4 + (date.getMonth() + 1) * 1e2 + date.getDate(),
      ),
    // Get all recurring and singular meetings for a room on a date
    getDaySchedule = (room, date) => {
      const scheduleDay = getScheduleDay(date),
        dateString = getScheduleDateString(date);
      icl.log(date);
      icl.log([scheduleDay, dateString]);
      icl.log(room);
      return room
        .filter((meeting) => {
          if (meeting.type == "recurring") {
            if ([].some.call(meeting.days, (day) => day == scheduleDay)) {
              return true;
            }
          } else {
            return meeting.date === dateString;
          }
        })
        .sort((a, b) => parseInt(a.start) - parseInt(b.start))
        .map((meeting) => ({
          course: meeting.course,
          start: meeting.start,
          end: meeting.end,
          meetingType: meeting.meetingType,
          instructors: meeting.instructors,
          length: (() => {
            const start = parseInt(meeting.start),
              end = parseInt(meeting.end),
              startMins = Math.floor(start / 100) * 60 + (start % 100),
              endMins = Math.floor(end / 100) * 60 + (end % 100);
            return endMins - startMins;
          })(),
        }));
    },
    getWeekSchedule = (room, date) => {
      var workingDate = new Date(date.getTime());
      const schedules = [],
        currentDay = getScheduleDay(workingDate),
        currentDate = workingDate.getDate();
      for (var day = 1; day < 6; day++) {
        workingDate = new Date(date.getTime());
        workingDate.setDate(currentDate - (currentDay - day));
        schedules.push(getDaySchedule(room, workingDate));
      }
      return schedules;
    },
    indexTransformer = (startTime) => {
      // startTime --> 7 a.m. usually
      return {
        getMeetingIndices: (meeting) => {
          const startMinutes =
              parseInt(meeting.start.slice(0, 2)) * 60 +
              parseInt(meeting.start.slice(2)),
            endMinutes =
              parseInt(meeting.end.slice(0, 2)) * 60 +
              parseInt(meeting.end.slice(2));
          return {
            startMinutes: startMinutes,
            endMinutes: endMinutes,
            startIndex: Math.floor((startMinutes - startTime) / 10),
            endIndex: Math.ceil((endMinutes - startTime) / 10), // Some finals end at x:29 or x:59, round up to the next ten minutes
            rowLength: Math.ceil((endMinutes - startMinutes) / 10), // Some finals end at x:29 or x:59, round up to the next ten minutes
          };
        },
        indexToTime: (timeIndex) => {
          const minutes = (timeIndex % 6) * 10,
            hours = startTime / 60 + Math.floor(timeIndex / 6),
            timeString = String(hours * 1e2 + minutes).padStart(4, 0);
          return { minutes: minutes, hours: hours, timeString: timeString };
        },
      };
    },
    daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  window.icl.dateUtil = {
    getScheduleDateString: getScheduleDateString,
    getDaySchedule: getDaySchedule,
    getWeekSchedule: getWeekSchedule,
    getScheduleDay: getScheduleDay,
    indexTransformer: indexTransformer,
    daysOfWeek: daysOfWeek,
  };
})();
