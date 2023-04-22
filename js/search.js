(() => {
  const search = (string, rooms) => {
    const roomNames = Object.keys(rooms),
      searchProcessed = string
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, ''),
      searchResults = roomNames
        .filter(
          (name) => name.includes(searchProcessed)
        ).map(
          (result) => [result, rooms[result]]
        );
    return searchResults;
  };
  window.icl.search = search;
})();
