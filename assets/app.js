/* TikTokトレンド速報 - フロントエンド */
(function () {
  "use strict";

  var state = {
    region: "JP",
    tab: "hashtags",
    data: null,
  };

  var listEl = document.getElementById("trend-list");
  var updatedEl = document.getElementById("updated-at");
  var sampleBanner = document.getElementById("sample-banner");

  document.getElementById("year").textContent = new Date().getFullYear();

  /* 再生数などを日本語表記に整形 (12345678 -> 1,234万) */
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

  function renderList() {
    listEl.innerHTML = "";
    var region = state.data && state.data.regions && state.data.regions[state.region];
    var items = (region && region[state.tab]) || [];

    if (!items.length) {
      listEl.appendChild(
        el("p", "empty-message", "データがまだありません。次回の自動更新をお待ちください。")
      );
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
      if (state.tab === "hashtags") {
        var hash = el("span", "hash", "#");
        name.appendChild(hash);
        name.appendChild(document.createTextNode(item.name || ""));
      } else {
        name.appendChild(document.createTextNode(item.title || ""));
      }
      body.appendChild(name);

      var metaParts = [];
      if (state.tab === "hashtags") {
        var posts = formatCount(item.posts);
        var views = formatCount(item.views);
        if (posts) metaParts.push("投稿 " + posts + "件");
        if (views) metaParts.push("再生 " + views + "回");
      } else if (item.author) {
        metaParts.push(item.author);
      }
      if (metaParts.length) {
        body.appendChild(el("div", "trend-meta", metaParts.join(" ・ ")));
      }

      link.appendChild(body);
      link.appendChild(el("span", "trend-arrow", "→"));
      listEl.appendChild(link);
    });
  }

  function bindChips(attr, key) {
    var chips = document.querySelectorAll(".chip[data-" + attr + "]");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        state[key] = chip.getAttribute("data-" + attr);
        renderList();
      });
    });
  }

  bindChips("region", "region");
  bindChips("tab", "tab");

  fetch("data/trends.json", { cache: "no-store" })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      state.data = data;
      updatedEl.textContent = "最終更新: " + (data.updated_at || "不明");
      if (data.is_sample) sampleBanner.hidden = false;
      renderList();
    })
    .catch(function () {
      updatedEl.textContent = "データの読み込みに失敗しました";
      listEl.appendChild(
        el("p", "empty-message", "データを読み込めませんでした。時間をおいて再度お試しください。")
      );
    });

  /* アフィリエイト枠 */
  fetch("assets/affiliates.json", { cache: "no-store" })
    .then(function (res) { return res.json(); })
    .then(function (items) {
      if (!Array.isArray(items) || !items.length) return;
      var section = document.getElementById("affiliate-section");
      var grid = document.getElementById("affiliate-grid");
      items.forEach(function (item) {
        if (!item.url || !item.title) return;
        var card = document.createElement("a");
        card.className = "affiliate-card";
        card.href = item.url;
        card.target = "_blank";
        card.rel = "noopener sponsored";
        card.appendChild(el("span", "affiliate-label", "PR"));
        card.appendChild(el("div", "affiliate-title", item.title));
        if (item.description) {
          card.appendChild(el("div", "affiliate-desc", item.description));
        }
        grid.appendChild(card);
      });
      if (grid.children.length) section.hidden = false;
    })
    .catch(function () { /* アフィリエイト設定なしでも動作する */ });
})();
