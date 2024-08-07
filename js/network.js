(() => {
  // Common request function
  const doRequest = (path) =>
      new Promise((resolve, reject) => {
        const request = new XMLHttpRequest(),
          listener = () => {
            if (request.readyState == 4) {
              // Make sure the response is valid
              if (!(request.status == 200 && request.responseText !== null)) {
                // Handle error
                return reject([request.status, request.responseText]);
              }
              // Pass classroom response text to the app
              return resolve(request.responseText);
            }
          };
        request.onreadystatechange = listener;
        request.open("GET", path, true);
        request.send();
      }),
    retrieveFinals = () => doRequest(icl.FINALS_PATH),
    retrieveClassrooms = () => doRequest(icl.DATA_PATH),
    retrieveGAClassroomList = () =>
      doRequest(window.icl.GA_CLASSROOMS_PATH).then((response) =>
        JSON.parse(response),
      );

  // Exports
  window.icl.retrieveClassrooms = retrieveClassrooms;
  window.icl.retrieveGAClassroomList = retrieveGAClassroomList;
  window.icl.retrieveFinals = retrieveFinals;
})();
