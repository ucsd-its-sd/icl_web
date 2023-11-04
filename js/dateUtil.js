(() => {
  const getScheduleDay = (date) => date.getDay(),
    getScheduleDateString = (date) =>
      "" +
      (date.getFullYear() * 1e4 + (date.getMonth() + 1) * 1e2 + date.getDate()),
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
          professors: meeting.professors,
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
        // icl.log(currentDate);
        // icl.log(currentDay);
        // icl.log(day);
        // icl.log(currentDate - (currentDay - day));
        workingDate.setDate(currentDate - (currentDay - day));
        // icl.log(workingDate);
        schedules.push(getDaySchedule(room, workingDate));
      }
      return schedules;
    };
  window.icl.dateUtil = {
    getScheduleDateString: getScheduleDateString,
    getDaySchedule: getDaySchedule,
    getWeekSchedule: getWeekSchedule,
    getScheduleDay: getScheduleDay,
  };
})();
