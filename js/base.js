(() => {
  window.icl = {
    logs: [],
    logLevel:
      (location.hostname != "icl.ucsd.it" || location.search.includes("log")) &&
      !location.search.includes("nolog"),
    log: (text) => {
      icl.logs.push(text);
      if (icl.logLevel) {
        console.log(text);
      }
    },
  };
})();
