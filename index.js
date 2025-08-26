import { dates } from "/utils/dates.js";

const tickersArr = [];
const generateReportBtn = document.querySelector(".generate-report-btn");
const loadingArea = document.querySelector(".loading-panel");
const apiMessage = document.getElementById("api-message");

generateReportBtn.addEventListener("click", fetchStockData);

document.getElementById("ticker-input-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const tickerInput = document.getElementById("ticker-input");
  if (tickerInput.value.length > 2) {
    generateReportBtn.disabled = false;
    const newTickerStr = tickerInput.value;
    tickersArr.push(newTickerStr.toUpperCase());
    tickerInput.value = "";
    renderTickers();
  } else {
    const label = document.getElementsByTagName("label")[0];
    label.style.color = "red";
    label.textContent =
      "You must add at least one ticker. A ticker is a 3 letter or more code for a stock. E.g TSLA for Tesla.";
  }
});

function renderTickers() {
  const tickersDiv = document.querySelector(".ticker-choice-display");
  tickersDiv.innerHTML = "";
  tickersArr.forEach((ticker) => {
    const newTickerSpan = document.createElement("span");
    newTickerSpan.textContent = ticker;
    newTickerSpan.classList.add("ticker");
    tickersDiv.appendChild(newTickerSpan);
  });
}

async function fetchStockData() {
  document.querySelector(".action-panel").style.display = "none";
  loadingArea.style.display = "flex";
  apiMessage.innerText = "Querying server...";

  try {
    const response = await fetch("http://localhost:3000/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: tickersArr }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    renderReport(data.report);
  } catch (err) {
    console.error("Error fetching report:", err);
    loadingArea.innerText =
      "There was an error generating the report. Please try again.";
  }
}

function renderReport(output) {
  loadingArea.style.display = "none";
  const outputArea = document.querySelector(".output-panel");
  outputArea.innerHTML = ""; // clear previous reports
  const report = document.createElement("p");
  report.textContent = output;
  outputArea.appendChild(report);
  outputArea.style.display = "flex";
}
