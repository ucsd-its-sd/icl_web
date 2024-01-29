(() => {
  window.icl = {
    // I'm begging you, don't log in production. It is SO SLOW
    logLevel:
      (location.hostname != "icl.ucsd.it" || location.search.includes("log")) &&
      !location.search.includes("nolog"),
    log: (text) => {
      if (icl.logLevel) {
        console.log(text);
      }
    },
    // Helper function to generate array of a specified length
    defaultArray: (length, defaultValue) =>
      Array.apply(null, { length: length }).map(() => defaultValue),
    // Blink link generator
    professorLink: (professor) =>
      "https://act.ucsd.edu/directory/search?" +
      "last={{last}}&first={{first}}&searchType=0"
        .replace("{{last}}", professor.split(" ")[1])
        .replace("{{first}}", professor.split(" ")[0]),
  };
})();
