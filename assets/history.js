/* TikTokトレンド速報 - 過去のトレンドページ */
(function () {
  "use strict";

  var state = { region: "JP", date: null };

  var listEl = document.getElementById("trend-list");
  var dateSelect = document.getElementById("date-select");

  document.getElementById("year").textContent = new Date().getFullYear();

  function formatCount(n) {
    if (n === null || n === undefined || n === "") return null;
    n = Number(n);
    if (isNaN(n)) return null;
    if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, "") + "億";
    if (n >= 1e4) return Math.round(n / 1e4).toLocaleString("ja-JP") + "万";
    return n.toLocaleString("ja-JP");
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function showMessage(text) {
    listEl.innerHTML = "";
    listEl.appendChild(el("p", "empty-message", text));
  }

  function renderDay(data) {
    listEl.innerHTML = "";
    var region = data.regions && data.regions[state.region];
    var items = (region && region.hashtags) || [];
    if (!items.length) {
      showMessage("この日のデータはありません。");
      return;
    }
    items.forEach(function (item, i) {
      var link = document.createElement("a");
      link.className = "trend-item";
      link.href = item.url || "#";
      link.target = "_blank";
      link.rel = "noopener";
      link.appendChild(el("span", "trend-rank", String(item.rank || i + 1)));

      var body = el("div", "trend-body");
      var name = el("div", "trend-name");
      name.appendChild(el("span", "hash", "#"));
      name.appendChild(document.createTextNode(item.name || ""));
      body.appendChild(name);

      var metaParts = [];
      var posts = formatCount(item.posts);
      var views = formatCount(item.views);
      if (posts) metaParts.push("投稿 " + posts + "件");
      if (views) metaParts.push("再生 " + views + "回");
      if (metaParts.length) body.appendChild(el("div", "trend-meta", metaParts.join(" ・ ")));

      link.appendChild(body);
      link.appendChild(el("span", "trend-arrow", "→"));
      listEl.appendChild(link);
    });
  }

  function loadDay(date) {
    state.date = date;
    fetch("data/history/" + date + ".json", { cache: "no-store" })
      .then(function (res) { return res.json(); })
      .then(renderDay)
      .catch(function () { showMessage("データを読み込めませんでした。"); });
  }

  var chips = document.querySelectorAll(".chip[data-region]");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.classList.remove("active"); });
      chip.classList.add("active");
      state.region = chip.getAttribute("data-region");
      if (state.date) loadDay(state.date);
    });
  });

  dateSelect.addEventListener("change", function () {
    loadDay(dateSelect.value);
  });

  fetch("data/history/index.json", { cache: "no-store" })
    .then(function (res) { return res.json(); })
    .then(function (dates) {
      if (!Array.isArray(dates) || !dates.length) {
        showMessage("履歴はまだありません。毎日の自動更新で少しずつ蓄積されます。");
        return;
      }
      dates.slice().reverse().forEach(function (d) {
        var opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        dateSelect.appendChild(opt);
      });
      loadDay(dates[dates.length - 1]);
    })
    .catch(function () {
      showMessage("履歴はまだありません。毎日の自動更新で少しずつ蓄積されます。");
    });
})();
