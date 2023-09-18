(() => {
  const retrieveClassrooms = (path) => {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest(),
        listener = () => {
          if (
            request.readyState == 4
          ) {
            if (
              !(request.status == 200
                && request.responseText !== null)
            ) {
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
    });
  },
    retrieveGAClassroomList = (path) => {
      return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest(),
          listener = () => {
            if (
              request.readyState == 4
            ) {
              if (
                !(request.status == 200
                  && request.responseText !== null)
              ) {
                // Handle error
                return reject([request.status, request.responseText]);
              }
              // Pass classroom response text to the app
              return resolve(JSON.parse(request.responseText));
            }
          };
        request.onreadystatechange = listener;
        request.open("GET", path, true);
        request.send();
      });
    };

  // Export
  window.icl.retrieveClassrooms = retrieveClassrooms;
  window.icl.retrieveGAClassroomList = retrieveGAClassroomList;
})();
