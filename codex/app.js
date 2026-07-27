const filters = [...document.querySelectorAll("[data-filter]")];
const activities = [...document.querySelectorAll("[data-activity]")];
const pickButton = document.querySelector("[data-pick]");
const result = document.querySelector("[data-result]");

function clearSelection() {
  activities.forEach((activity) => activity.removeAttribute("data-selected"));
}

function showAllActivities() {
  activities.forEach((activity) => {
    activity.hidden = false;
  });
}

function setActiveFilter(activeFilter) {
  filters.forEach((filter) => {
    filter.setAttribute("aria-pressed", String(filter === activeFilter));
  });
}

filters.forEach((filter) => {
  filter.addEventListener("click", () => {
    const isActive = filter.getAttribute("aria-pressed") === "true";
    clearSelection();

    if (isActive) {
      setActiveFilter(null);
      showAllActivities();
      result.textContent = "Three ways out, all from where you are.";
      return;
    }

    const selectedType = filter.dataset.filter;
    setActiveFilter(filter);
    activities.forEach((activity) => {
      activity.hidden = activity.dataset.activity !== selectedType;
    });
    result.textContent = `${filter.querySelector(".filter-name").textContent} route selected.`;
  });
});

pickButton.addEventListener("click", () => {
  const chosen = activities[Math.floor(Math.random() * activities.length)];
  const title = chosen.querySelector("h3").textContent;

  setActiveFilter(null);
  showAllActivities();
  clearSelection();
  chosen.setAttribute("data-selected", "true");
  result.textContent = `Today’s pick: ${title}`;
  chosen.scrollIntoView({ behavior: "smooth", block: "center" });
});
