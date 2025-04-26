htmx.config.selfRequestsOnly = false;
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    document.querySelector(".dark-icon").style.display = "none";
    document.querySelector(".light-icon").style.display = "block";
  }

  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.contains("dark");

    if (isDark) {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.querySelector(".dark-icon").style.display = "block";
      document.querySelector(".light-icon").style.display = "none";
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      document.querySelector(".dark-icon").style.display = "none";
      document.querySelector(".light-icon").style.display = "block";
      localStorage.setItem("theme", "dark");
    }
  });
});

function appendUserMessage(event) {
  const form = event.target;
  const input = form.querySelector('input[name="request"]');
  const message = input.value.trim();

  if (message !== "") {
    const messageDiv = document.createElement("div");
    messageDiv.className = "user-message";
    messageDiv.textContent = message;
    document.getElementById("chat-messages").appendChild(messageDiv);
  }

  setTimeout(() => {
    input.value = "";
  }, 10);
}

function showLoadingMessage(event) {
  const form = event.target;
  const input = form.querySelector('[name="request"]');
  const message = input?.value?.trim() || "selected input";
  document.getElementById("knowledge-response").textContent =
    `Loading knowledge for '${message}'...`;
}
