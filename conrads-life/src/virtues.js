/**
 * Every classical virtue used in Conrad's Game of Life.
 * force  — how many cells it can shove in a push (1 = swap only)
 * idealSpace — exact empty Moore-neighbor count that means "right amount of space"
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.ConradVirtues = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const VIRTUES = Object.freeze([
    {
      id: "prudence",
      name: "Prudence",
      force: 2,
      idealSpace: 5,
      color: "#7ec8a3",
      blurb: "Sees far; wants breathing room to judge.",
    },
    {
      id: "justice",
      name: "Justice",
      force: 3,
      idealSpace: 4,
      color: "#6b9ac4",
      blurb: "Balances claims; needs even neighbors.",
    },
    {
      id: "fortitude",
      name: "Fortitude",
      force: 4,
      idealSpace: 3,
      color: "#c47b5a",
      blurb: "Stands firm; can shove a heavy block.",
    },
    {
      id: "temperance",
      name: "Temperance",
      force: 2,
      idealSpace: 4,
      color: "#d4b483",
      blurb: "The measure of harmony itself.",
    },
    {
      id: "faith",
      name: "Faith",
      force: 2,
      idealSpace: 5,
      color: "#b8a0d4",
      blurb: "Trusts the unseen; prefers open sky.",
    },
    {
      id: "hope",
      name: "Hope",
      force: 1,
      idealSpace: 6,
      color: "#8ecae6",
      blurb: "Looks ahead; needs wide prospects.",
    },
    {
      id: "charity",
      name: "Charity",
      force: 3,
      idealSpace: 3,
      color: "#e07a7a",
      blurb: "Gives of itself; lives closer to others.",
    },
    {
      id: "diligence",
      name: "Diligence",
      force: 3,
      idealSpace: 2,
      color: "#e9c46a",
      blurb: "Works in tight quarters.",
    },
    {
      id: "patience",
      name: "Patience",
      force: 1,
      idealSpace: 5,
      color: "#90be6d",
      blurb: "Waits; does not crowd.",
    },
    {
      id: "kindness",
      name: "Kindness",
      force: 2,
      idealSpace: 3,
      color: "#f4a261",
      blurb: "Gentle proximity without smothering.",
    },
    {
      id: "humility",
      name: "Humility",
      force: 1,
      idealSpace: 4,
      color: "#a8dadc",
      blurb: "Takes little room; soft push.",
    },
    {
      id: "chastity",
      name: "Chastity",
      force: 2,
      idealSpace: 6,
      color: "#f1faee",
      blurb: "Keeps clear boundaries.",
    },
  ]);

  const VIRTUE_BY_ID = Object.freeze(
    Object.fromEntries(VIRTUES.map((v) => [v.id, v]))
  );

  function randomVirtueId(rng = Math.random) {
    return VIRTUES[Math.floor(rng() * VIRTUES.length)].id;
  }

  return { VIRTUES, VIRTUE_BY_ID, randomVirtueId };
});
