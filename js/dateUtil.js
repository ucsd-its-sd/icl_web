(() => {
  const getScheduleDay = (date) => date.getDay(),
    getScheduleDateString = (date) => '' + (date.getFullYear() * 1e4 + (date.getMonth() + 1) * 1e2 + date.getDate()),
    getDaySchedule = (room, date) => {
      const scheduleDay = getScheduleDay(date),
        dateString = getScheduleDateString(date);
      return room.filter((meeting) => {
        if (meeting.type == 'recurring') {
          if ([].some.call(meeting.days, (day) => day == scheduleDay)) {
            return true;
          }
        } else {
          return meeting.date === dateString;
        }
      }).sort((a, b) => {
        b.start - a.start;
      }).map((meeting) => ({
        course: meeting.course,
        start: meeting.start,
        end: meeting.end,
        meetingType: meeting.meetingType,
        professors: meeting.professors,
        length: (() => {
          const start = parseInt(meeting.start),
            end = parseInt(meeting.end),
            startMins = Math.floor(start / 100) * 60 + start % 100,
            endMins = Math.floor(end / 100) * 60 + end % 100;
          return endMins - startMins;
        })()
      }));
    },
    getWeekSchedule = (room, date) => {
      const schedules = [],
        workingDate = new Date(date.getTime()),
        currentDay = getScheduleDay(workingDate),
        currentDate = workingDate.getDate();
      for (var day = 1; day < 6; day++) {
        workingDate.setDate(currentDate - (currentDay - day));
        schedules.push(getDaySchedule(room, workingDate))
      }
      return schedules;
    };
  window.icl.dateUtil = { getScheduleDateString: getScheduleDateString, getDaySchedule: getDaySchedule, getWeekSchedule: getWeekSchedule, getScheduleDay: getScheduleDay };
})();
