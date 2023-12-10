(() => {
  window.icl = {
    logLevel:
      (location.hostname != "icl.ucsd.it" || location.search.includes("log")) &&
      !location.search.includes("nolog"),
    log: (text) => {
      if (icl.logLevel) {
        console.log(text);
      }
    },
    defaultArray: (length, defaultValue) =>
      Array.apply(null, { length: length }).map(() => defaultValue),
    professorLink: (professor) =>
      "https://act.ucsd.edu/directory/search?" +
      "last={{last}}&first={{first}}&searchType=0"
        .replace("{{last}}", professor.split(" ")[1])
        .replace("{{first}}", professor.split(" ")[0]),
  };
})();
