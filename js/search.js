(() => {
  const search = (string, rooms) => {
    const roomNames = Object.keys(rooms),
      // Make sure search is valid
      searchProcessed = string.toUpperCase().replace(/[^A-Z0-9]+/g, ""),
      searchResults = roomNames
        // I'll pretend this is O(n)
        .filter((name) => name.includes(searchProcessed))
        // Return full search result
        .map((result) => [result, rooms[result]]);
    return searchResults;
  };
  window.icl.search = search;
})();
