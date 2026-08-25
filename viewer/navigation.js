export function createPageNavigation({ onNavigate }) {
  let totalPages = 0;
  let navigationTimer = null;

  const pageNavigation =
    document.getElementById("pageNavigation");

  const pageInput =
    document.getElementById("pageInput");

  const pageTotal =
    document.getElementById("pageTotal");

  function setPage(page) {
    pageInput.value = page;
  }

  function setTotalPages(total) {
    totalPages = total;
    pageTotal.textContent = `/ ${total}`;
  }

  function navigate() {
    let page = Number.parseInt(pageInput.value, 10);

    if (!Number.isInteger(page) || page < 1) {
      page = 1;
    }

    if (page > totalPages) {
      page = totalPages;
    }

    setPage(page);
    onNavigate(page);
  }

  pageInput.addEventListener("input", () => {
    clearTimeout(navigationTimer);

    navigationTimer = setTimeout(navigate, 1000);
  });

  return {
    setPage,
    setTotalPages,
  };
}
