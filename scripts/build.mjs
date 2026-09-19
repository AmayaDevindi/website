#!/usr/bin/env node
/**
 * Site build script.
 * Reads everything under content/ (and a couple of image folders) and
 * regenerates the static HTML pages at the repo root. This is what runs
 * automatically on every push via .github/workflows/deploy.yml — you should
 * never need to hand-edit the generated <!-- ... --> HTML files directly.
 *
 * Run locally with: npm install && npm run build
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const writeOut = (p, content) => {
  const full = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("wrote", p);
};

const site = JSON.parse(read("content/site.json"));
const BASE_TEMPLATE = read("templates/base.html");
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function mdInline(s) {
  // Renders a single line of markdown (bold/italics/links) without wrapping <p> tags.
  return marked.parseInline(String(s || ""));
}

function mdBlock(s) {
  return marked.parse(String(s || ""));
}

/** Reads every non-template markdown file in a content subfolder, parsed with frontmatter. */
function loadMarkdownDir(relDir) {
  const dir = path.join(ROOT, relDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data, content } = matter(raw);
      return { ...data, body: content.trim(), file: f };
    })
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

/** Lists real media files in an images/ subfolder (skips icon.svg and non-media files). */
function listMediaFiles(relDir) {
  const dir = path.join(ROOT, relDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => (IMAGE_EXT.test(f) || VIDEO_EXT.test(f)) && f.toLowerCase() !== "icon.svg")
    .sort((a, b) => a.localeCompare(b));
}

function prettyTitle(filename) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** depth = 0 for root-level pages, 1 for pages one folder deep (community resources). */
function resolveHref(href, depth) {
  if (depth === 0) return href;
  const prefix = "../".repeat(depth);
  if (href.startsWith("community_resourses/")) {
    return href.slice("community_resourses/".length);
  }
  return prefix + href;
}
function assetPrefix(depth) {
  return "../".repeat(depth);
}

function navHtml(activeKey, depth) {
  const homeHref = resolveHref("about_me.html", depth);
  const links = site.sections.map((s) => {
    const href = resolveHref(s.href, depth);
    const active = s.key === activeKey ? " is-active" : "";
    return `<a class="nav-link${active}" href="${href}">${esc(s.label)}</a>`;
  }).join("\n        ");

  return `<header class="site-nav">
  <div class="container">
    <a class="brand" href="${homeHref}">
      <span class="brand-mark">AD</span>
      <span>${esc(site.name)}</span>
    </a>
    <nav class="nav-links" data-nav-links>
      <a class="nav-link${activeKey === "home" ? " is-active" : ""}" href="${homeHref}">Home</a>
      ${links}
    </nav>
    <div class="nav-right">
      <button class="theme-toggle" data-theme-toggle aria-label="Toggle dark mode" type="button">
        <i class="fas fa-sun icon-sun"></i>
        <i class="fas fa-moon icon-moon"></i>
      </button>
      <button class="nav-toggle" data-nav-toggle aria-label="Toggle menu" type="button"><i class="fas fa-bars"></i></button>
    </div>
  </div>
</header>`;
}

function footerHtml(depth) {
  const email = site.email;
  const github = site.github;
  return `<footer class="site-footer">
  <div class="container">
    <span>&copy; ${new Date().getFullYear()} ${esc(site.name)}. Built with care.</span>
    <span class="footer-social">
      ${github ? `<a href="${esc(github)}" target="_blank" rel="noopener"><i class="fab fa-github"></i></a>` : ""}
      ${email && email.indexOf("REPLACE_WITH") === -1 ? `<a href="mailto:${esc(email)}"><i class="fas fa-envelope"></i></a>` : ""}
    </span>
  </div>
</footer>`;
}

function renderPage({ title, description, icon, section, activeKey, depth, body, extraScripts }) {
  return BASE_TEMPLATE
    .replaceAll("{{TITLE}}", esc(title))
    .replaceAll("{{DESCRIPTION}}", esc(description || ""))
    .replaceAll("{{ICON}}", resolveHref(icon, depth))
    .replaceAll("{{ASSET_PREFIX}}", assetPrefix(depth))
    .replaceAll("{{SECTION}}", section)
    .replaceAll("{{NAV}}", navHtml(activeKey, depth))
    .replaceAll("{{FOOTER}}", footerHtml(depth))
    .replaceAll("{{BODY}}", body)
    .replaceAll("{{EXTRA_SCRIPTS}}", extraScripts || "");
}

/* ============================================================
   HOME PAGE (about_me.html + index.html)
   ============================================================ */
function buildHome() {
  const sectionIcons = {
    projects: "fa-diagram-project", academic: "fa-graduation-cap", "self-learning": "fa-book-open",
    hobbies: "fa-seedling", aesthetic: "fa-palette", community: "fa-people-group"
  };
  const cards = site.sections.map((s) => `
    <a class="card card-hover section-card reveal" href="${esc(s.href)}" data-section="${esc(s.key)}">
      <div class="glyph"><i class="fas ${esc(s.icon || sectionIcons[s.key] || "fa-star")}"></i></div>
      <h3>${esc(s.label)}</h3>
      <p>${esc(s.desc)}</p>
      <span class="go">Explore <i class="fas fa-arrow-right"></i></span>
    </a>`).join("\n");

  const hasResume = exists(site.resumeFile);
  const resumeBtn = `<a class="btn btn-primary" href="${esc(site.resumeFile)}" download>
      <i class="fas fa-download"></i> Download Resume
    </a>`;

  const body = `
<section class="section-tight hero" data-section="home">
  <div class="hero-avatar reveal">
    <img src="${esc(site.avatar)}" alt="${esc(site.name)}" onerror="this.onerror=null; this.src='https://placehold.co/200x200?text=${esc(site.name.split(" ").map(w=>w[0]).join(""))}';">
  </div>
  <div>
    <div class="eyebrow reveal"><i class="fas fa-sparkles"></i> ${esc(site.role)}</div>
    <h1 class="hero-name reveal">${esc(site.name)}</h1>
    <p class="hero-tagline reveal">${site.taglineHtml}</p>
    <div class="hero-actions reveal">
      ${resumeBtn}
      <a class="btn btn-outline" href="#contact"><i class="fas fa-paper-plane"></i> Get in touch</a>
    </div>
  </div>
</section>

<section class="section" data-reveal>
  <div class="container">
    <div class="eyebrow">Explore</div>
    <h2 class="section-heading">Everything in one place</h2>
    <p class="section-sub">Six sides of the same portfolio — pick where you'd like to start.</p>
    <div class="section-grid" style="margin-top:36px;">
      ${cards}
    </div>
  </div>
</section>

<section class="section-tight" id="contact">
  <div class="container">
    <div class="card contact-card reveal">
      <div>
        <div class="eyebrow">Contact</div>
        <h2 class="section-heading" style="font-size:1.8rem;">Let's talk</h2>
        <p class="section-sub" style="margin-bottom:20px;">Have a question, an opportunity, or just want to say hi? Send a message and I'll get back to you.</p>
        <div class="contact-links">
          ${site.email && site.email.indexOf("REPLACE_WITH") === -1 ? `<a href="mailto:${esc(site.email)}"><span class="ico"><i class="fas fa-envelope"></i></span> ${esc(site.email)}</a>` : ""}
          ${site.github ? `<a href="${esc(site.github)}" target="_blank" rel="noopener"><span class="ico"><i class="fab fa-github"></i></span> GitHub</a>` : ""}
        </div>
      </div>
      <form data-contact-form data-endpoint="${esc(site.contactFormEndpoint || "")}" data-mailto="${esc(site.email || "")}" action="${esc(site.contactFormEndpoint || "")}" method="POST">
        <div class="field">
          <label for="name">Name</label>
          <input id="name" name="name" type="text" required>
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required>
        </div>
        <div class="field">
          <label for="message">Message</label>
          <textarea id="message" name="message" rows="4" required></textarea>
        </div>
        <button class="btn btn-primary btn-block" type="submit"><i class="fas fa-paper-plane"></i> Send message</button>
        <p data-form-status style="margin-top:10px; font-size:0.85rem; color:var(--text-muted);"></p>
      </form>
    </div>
  </div>
</section>`;

  const html = renderPage({
    title: `${site.name} — Portfolio`,
    description: `Personal portfolio of ${site.name}: ${site.role}.`,
    icon: "images/main/icon.svg",
    section: "home",
    activeKey: "home",
    depth: 0,
    body
  });

  writeOut("about_me.html", html);
  writeOut("index.html", html);
}

/* ============================================================
   PROJECTS
   ============================================================ */
function buildProjects() {
  const projects = loadMarkdownDir("content/projects");
  const allTags = [...new Set(projects.flatMap((p) => p.tags || []))];

  const chips = `<button class="filter-chip is-active" data-filter="all" type="button">All</button>` +
    allTags.map((t) => `<button class="filter-chip" data-filter="${esc(t.toLowerCase())}" type="button">${esc(t)}</button>`).join("");

  const cards = projects.map((p) => {
    const tagAttr = (p.tags || []).map((t) => t.toLowerCase()).join("|");
    const target = p.external ? ` target="_blank" rel="noopener"` : "";
    return `
    <div class="card card-hover project-card reveal" data-tags="${esc(tagAttr)}">
      <img class="thumb" src="${esc(p.image)}" alt="${esc(p.title)}" onerror="this.style.display='none';">
      <div class="body">
        <h3>${esc(p.title)}</h3>
        <p>${mdInline(p.body)}</p>
        <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        <a class="btn btn-primary btn-sm" href="${esc(p.link)}"${target}>${esc(p.linkLabel || "View Details")} <i class="fas fa-arrow-right"></i></a>
      </div>
    </div>`;
  }).join("\n");

  const body = `
<div class="page-header container" data-section="projects">
  <div class="eyebrow"><i class="fas fa-diagram-project"></i> Projects</div>
  <h1>My Projects &amp; Portfolio Work</h1>
  <p>A selection of my best work demonstrating technical skill, attention to detail, and comprehensive problem-solving across various domains.</p>
</div>
<div class="container">
  <div class="filter-bar">
    <input class="search-input" type="search" placeholder="Search projects…" data-project-search>
    ${chips}
  </div>
  <div class="projects-grid" data-project-grid>
    ${cards}
    <div class="empty-state" data-project-empty style="display:none;">No projects match that search yet — try another term or filter.</div>
  </div>
</div>`;

  const extraScripts = `<script>
document.addEventListener('DOMContentLoaded', function () {
  SiteFilter.init({
    itemSelector: '.project-card',
    chipSelector: '.filter-chip',
    searchSelector: '[data-project-search]',
    emptySelector: '[data-project-empty]',
    dataAttr: 'data-tags'
  });
});
</script>`;

  const html = renderPage({
    title: "Projects — " + site.name,
    description: "Machine learning, web apps, and hands-on builds by " + site.name + ".",
    icon: "images/projects/icon.svg",
    section: "projects",
    activeKey: "projects",
    depth: 0,
    body,
    extraScripts
  });
  writeOut("projects.html", html);
}

/* ============================================================
   ACADEMIC & EXTRACURRICULAR
   ============================================================ */
function buildAcademic() {
  const data = JSON.parse(read("content/academic.json"));

  const eduCards = data.educationHistory.map((e) => {
    const statusOk = e.status === "Finished";
    return `
    <div class="card card-hover edu-card reveal">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
        <h3 style="font-size:1.1rem;">${esc(e.institution)}</h3>
        <span class="badge">${esc(e.type)}</span>
      </div>
      ${e.details ? `<p style="color:var(--text-muted); font-size:0.9rem;">${esc(e.details)}</p>` : ""}
      <div class="badge-row">
        <span class="badge"><i class="fas fa-clock"></i> ${esc(e.startYear)}${e.endYear ? " – " + esc(e.endYear) : " – Present"}</span>
        <span class="badge ${statusOk ? "status-ok" : "status-pending"}"><i class="fas ${statusOk ? "fa-check-circle" : "fa-hourglass-half"}"></i> ${esc(e.status)}</span>
      </div>
    </div>`;
  }).join("\n");

  const statBoxes = (stats) => stats.map((s) => `
    <div class="stat-box"><div class="k">${esc(s.name)}</div><div class="v">${esc(s.grade)}</div></div>
  `).join("");

  const mainResults = data.results.filter((r) => !r.compact);
  const compactResults = data.results.filter((r) => r.compact);

  const resultCards = mainResults.map((r) => `
    <div class="card card-hover result-card reveal">
      <h3 style="font-size:1.1rem;">${esc(r.title)}</h3>
      ${r.image ? `<img src="${esc(r.image)}" alt="${esc(r.title)}" data-lightbox-url="${esc(r.image)}" onerror="this.style.display='none';">` : ""}
      <div class="stats-grid">${statBoxes(r.stats)}</div>
    </div>`).join("\n");

  const compactCards = compactResults.map((r) => `
    <div class="card card-hover reveal" style="padding:18px 24px; display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap;">
      <h3 style="font-size:1.05rem;"><i class="fas fa-trophy" style="color:var(--accent); margin-right:10px;"></i>${esc(r.title)}</h3>
      <div style="display:flex; gap:10px;">${statBoxes(r.stats)}</div>
    </div>`).join("\n");

  const langCards = data.languages.map((l) => {
    if (l.certificates && l.certificates.length) {
      const certs = l.certificates.map((c) => `
        <div class="cert-thumb" data-lightbox-url="${esc(c.url)}">
          <img src="${esc(c.url)}" alt="${esc(l.name)} certificate" onerror="this.parentElement.style.display='none';">
        </div>`).join("");
      return `
      <div class="card card-hover lang-card reveal" style="grid-column: 1 / -1;">
        <div style="display:flex; flex-wrap:wrap; gap:24px;">
          <div style="min-width:160px;">
            <h3 style="font-size:1.4rem;">${esc(l.name)}</h3>
            ${l.proficiency ? `<p style="color:var(--accent); font-weight:700; font-size:0.9rem;">${esc(l.proficiency)}</p>` : ""}
          </div>
          <div class="cert-grid" style="flex:1;">${certs}</div>
        </div>
      </div>`;
    }
    return `
    <div class="card card-hover lang-card reveal">
      <h3 style="font-size:1.3rem;">${esc(l.name)}</h3>
      ${l.proficiency ? `<p style="color:var(--text-muted); font-size:0.9rem;">${esc(l.proficiency)}</p>` : ""}
    </div>`;
  }).join("\n");

  const extraCards = data.extracurriculars.map((x) => {
    const n = x.images.length;
    const countClass = n === 1 ? "count-1" : n === 2 ? "count-2" : "count-4";
    const imgs = x.images.map((img) => `<img src="${esc(img.url)}" alt="${esc(img.name)}" data-lightbox-url="${esc(img.url)}">`).join("");
    const spanClass = x.span === 3 ? "span-3" : x.span === 2 ? "span-2" : "";
    const link = x.linkHref ? `<a class="btn btn-outline btn-sm" href="${esc(x.linkHref)}">${esc(x.linkLabel)} <i class="fas fa-arrow-right"></i></a>` : "";
    const stats = x.stats && x.stats.length ? `<div class="stats-grid" style="margin-top:8px;">${statBoxes(x.stats)}</div>` : "";
    return `
    <div class="card card-hover extra-card ${spanClass} reveal" style="padding:0;">
      <div class="extra-images ${countClass}">${imgs}</div>
      <div style="padding:22px;">
        <h3 style="font-size:1.15rem; display:flex; align-items:center; gap:10px; margin-bottom:8px;"><i class="fas ${esc(x.icon)}" style="color:var(--accent);"></i> ${esc(x.title)}</h3>
        <p style="color:var(--text-muted); font-size:0.9rem;">${esc(x.note)}</p>
        ${stats}
        ${link ? `<div style="margin-top:12px;">${link}</div>` : ""}
      </div>
    </div>`;
  }).join("\n");

  const body = `
<div class="page-header container" data-section="academic">
  <div class="eyebrow"><i class="fas fa-graduation-cap"></i> Academic &amp; Extracurricular</div>
  <h1>${esc(data.hero.heading)}</h1>
  <p>${esc(data.hero.sub)}</p>
</div>

<div class="container" data-reveal>
  <div class="section-tight">
    <h2 class="section-heading" style="font-size:1.6rem;">Education Journey</h2>
    <div class="grid-3">${eduCards}</div>
  </div>

  <div class="section-tight">
    <h2 class="section-heading" style="font-size:1.6rem;">Core Academic Results</h2>
    <div class="grid-2">${resultCards}</div>
    ${compactCards ? `<div style="display:flex; flex-direction:column; gap:14px; margin-top:14px;">${compactCards}</div>` : ""}
  </div>

  <div class="section-tight">
    <h2 class="section-heading" style="font-size:1.6rem;">Language Proficiency</h2>
    <div class="grid-2">${langCards}</div>
  </div>
</div>

<div class="section-tight" style="background:var(--surface-2); border-top:1px solid var(--border); border-bottom:1px solid var(--border);">
  <div class="container" data-reveal>
    <h2 class="section-heading" style="font-size:1.6rem; text-align:center;">Extracurricular Activities</h2>
    <p class="section-sub" style="margin:0 auto 30px; text-align:center;">Consistent participation in university and school events and activities.</p>
    <div class="extra-grid">${extraCards}</div>
  </div>
</div>`;

  const extraScripts = `<script>document.addEventListener('DOMContentLoaded', function(){ SiteGallery.bind('main'); });</script>`;

  const html = renderPage({
    title: "Academic & Extracurricular — " + site.name,
    description: "Education history, grades, languages and extracurricular activities.",
    icon: "images/academic_and_extra/icon.svg",
    section: "academic",
    activeKey: "academic",
    depth: 0,
    body,
    extraScripts
  });
  writeOut("academic_and_extracurricular.html", html);
}

/* ============================================================
   SELF LEARNING
   ============================================================ */
function buildSelfLearning() {
  const certificates = loadMarkdownDir("content/self-learning/certificates");
  const topics = loadMarkdownDir("content/self-learning/topics");
  const tools = JSON.parse(read("content/self-learning/tools.json"));

  const certCards = certificates.map((c) => `
    <div class="card card-hover certificate-card reveal">
      <img src="${esc(c.image)}" alt="${esc(c.name)}" onerror="this.onerror=null; this.src='https://placehold.co/600x400?text=Certificate';">
      <div class="body">
        <h4 style="font-size:1.05rem;">${esc(c.name)}</h4>
        <p style="color:var(--text-muted); font-size:0.85rem;">Provider: <b style="color:var(--accent);">${esc(c.provider)}</b></p>
        <a href="${esc(c.verifyLink)}" target="_blank" rel="noopener" class="resource-link" style="margin-top:auto;"><i class="fas fa-external-link-alt"></i> View &amp; Verify Certificate</a>
      </div>
    </div>`).join("\n");

  const toolChips = tools.map((t) => `<div class="tool-chip"><i class="${esc(t.icon)}"></i><span>${esc(t.name)}</span></div>`).join("\n");

  const topicCards = topics.map((t) => `
    <div class="card card-hover reveal" style="padding:26px; margin-bottom:20px; break-inside:avoid; display:inline-block; width:100%;">
      <h3 style="font-size:1.35rem; color:var(--accent); margin-bottom:10px;">${esc(t.title)}</h3>
      <p style="color:var(--text-muted); font-size:0.92rem;">${mdInline(t.body)}</p>
      <div class="resource-list">
        ${(t.resources || []).map((r) => `<a class="resource-link" href="${esc(r.link)}" target="_blank" rel="noopener"><i class="fas fa-link"></i> ${esc(r.name)}</a>`).join("\n")}
      </div>
    </div>`).join("\n");

  const body = `
<div class="page-header container" data-section="self-learning">
  <div class="eyebrow"><i class="fas fa-book-open"></i> Self Learning</div>
  <h1>Pursuing Knowledge to Create Meaningful Impact</h1>
  <p>Passionate about <b>Computer Science</b>, <b>AI</b>, and <b>Data Science</b> — using technology and innovation to create positive change in society.</p>
  <div style="margin-top:22px;"><a class="btn btn-primary" href="projects.html">Explore Projects <i class="fas fa-arrow-right"></i></a></div>
</div>

<div class="container section-tight" data-reveal>
  <h2 class="section-heading" style="font-size:1.6rem; text-align:center;">Certificates Gained</h2>
  <div class="section-grid" style="grid-template-columns:repeat(auto-fit, minmax(260px,1fr)); margin-top:30px;">
    ${certCards}
  </div>
</div>

<div class="container section-tight">
  <h2 class="section-heading" style="font-size:1.4rem; text-align:center; margin-bottom:20px;">Core Toolkit &amp; Technologies</h2>
  <div class="tool-strip">${toolChips}</div>
</div>

<div class="container section-tight" data-reveal>
  <h2 class="section-heading" style="font-size:1.6rem; text-align:center;">Learning Notes &amp; Resources</h2>
  <p class="section-sub" style="margin:0 auto 30px; text-align:center;">An overview of my current and completed learning tracks — click through to the resources I used.</p>
  <div class="masonry" style="column-count:1;" data-topics-grid>
    ${topicCards}
  </div>
</div>
<style>
@media (min-width:640px){ [data-topics-grid]{ column-count:2 !important; } }
@media (min-width:1024px){ [data-topics-grid]{ column-count:3 !important; } }
</style>`;

  const html = renderPage({
    title: "Self Learning — " + site.name,
    description: "Certificates, tools, and ongoing learning tracks.",
    icon: "images/self_learned/icon.svg",
    section: "self-learning",
    activeKey: "self-learning",
    depth: 0,
    body
  });
  writeOut("self_learning.html", html);
}

/* ============================================================
   HOBBIES (garden gallery — auto-scans images/garden/)
   ============================================================ */
function buildHobbies() {
  const files = listMediaFiles("images/garden");
  const categoryFor = (f) => {
    if (/^f_/i.test(f)) return "Flowers";
    if (/^fr_/i.test(f)) return "Fruits";
    if (/^v_/i.test(f)) return "Vegetables";
    return "Other";
  };
  const cats = [...new Set(files.map(categoryFor))];
  const chips = `<button class="filter-chip is-active" data-filter="all" type="button">All</button>` +
    cats.map((c) => `<button class="filter-chip" data-filter="${c.toLowerCase()}" type="button">${esc(c)}</button>`).join("");

  const items = files.map((f) => {
    const cat = categoryFor(f);
    const url = `images/garden/${f}`;
    return `
    <div class="masonry-item reveal" data-tags="${cat.toLowerCase()}" data-lightbox-url="${esc(url)}">
      <img src="${esc(url)}" alt="${esc(cat)}" loading="lazy">
      <span class="cap">${esc(cat)}</span>
    </div>`;
  }).join("\n");

  const body = `
<div class="page-header container" data-section="hobbies">
  <div class="eyebrow"><i class="fas fa-seedling"></i> Hobbies</div>
  <h1>Garden Gallery</h1>
  <p>Explore my home garden, a vibrant sanctuary of color, life, and fresh harvests.</p>
</div>
<div class="container">
  <div class="filter-bar">${chips}</div>
  <div class="masonry" data-gallery>
    ${items || `<p class="empty-state">No photos yet — drop images into images/garden/ (name them f_*, fr_*, or v_* for flowers/fruit/veg) and push.</p>`}
  </div>
</div>`;

  const extraScripts = `<script>
document.addEventListener('DOMContentLoaded', function () {
  SiteFilter.init({ itemSelector: '.masonry-item', chipSelector: '.filter-chip', dataAttr: 'data-tags' });
  SiteGallery.bind('[data-gallery]');
});
</script>`;

  const html = renderPage({
    title: "Hobbies — " + site.name,
    description: "A look into my home garden.",
    icon: "images/garden/icon.svg",
    section: "hobbies",
    activeKey: "hobbies",
    depth: 0,
    body,
    extraScripts
  });
  writeOut("hobbies.html", html);
}

/* ============================================================
   AESTHETIC (art gallery — auto-scans images/art/)
   ============================================================ */
function buildAesthetic() {
  const metaPath = "content/aesthetic-meta.json";
  const meta = exists(metaPath) ? JSON.parse(read(metaPath)) : {};
  const files = listMediaFiles("images/art");

  const chips = `<button class="filter-chip is-active" data-filter="all" type="button">All</button>
    <button class="filter-chip" data-filter="image" type="button">Images</button>
    <button class="filter-chip" data-filter="video" type="button">Process Videos</button>`;

  const items = files.map((f) => {
    const isVideo = VIDEO_EXT.test(f);
    const url = `images/art/${f}`;
    const caption = (meta[f] && meta[f].caption) || prettyTitle(f);
    const mediaTag = isVideo
      ? `<video src="${esc(url)}" muted loop autoplay playsinline preload="metadata"></video>`
      : `<img src="${esc(url)}" alt="${esc(caption)}" loading="lazy">`;
    return `
    <div class="masonry-item reveal" data-tags="${isVideo ? "video" : "image"}" data-lightbox-url="${esc(url)}" data-lightbox-type="${isVideo ? "video" : "image"}">
      ${mediaTag}
      <span class="cap">${esc(caption)}</span>
    </div>`;
  }).join("\n");

  const body = `
<div class="page-header container" data-section="aesthetic">
  <div class="eyebrow"><i class="fas fa-palette"></i> Aesthetic</div>
  <h1>Art Showcase</h1>
  <p>A visual journey through my latest drawings, paintings, and creative process.</p>
</div>
<div class="container">
  <div class="filter-bar">${chips}</div>
  <div class="masonry" data-gallery>
    ${items || `<p class="empty-state">No pieces yet — drop images or videos into images/art/ and push.</p>`}
  </div>
</div>`;

  const extraScripts = `<script>
document.addEventListener('DOMContentLoaded', function () {
  SiteFilter.init({ itemSelector: '.masonry-item', chipSelector: '.filter-chip', dataAttr: 'data-tags' });
  SiteGallery.bind('[data-gallery]');
});
</script>`;

  const html = renderPage({
    title: "Aesthetic — " + site.name,
    description: "Drawings, paintings, and creative process.",
    icon: "images/art/icon.svg",
    section: "aesthetic",
    activeKey: "aesthetic",
    depth: 0,
    body,
    extraScripts
  });
  writeOut("aesthetic.html", html);
}

/* ============================================================
   COMMUNITY RESOURCES
   ============================================================ */
function buildCommunity() {
  const entries = loadMarkdownDir("content/community-resources");
  const groups = [];
  entries.forEach((e) => {
    let g = groups.find((x) => x.key === e.group);
    if (!g) { g = { key: e.group, label: e.groupLabel, items: [] }; groups.push(g); }
    g.items.push(e);
  });

  const groupCards = groups.map((g) => `
    <div class="card resource-group reveal">
      <div class="head">
        <span class="glyph"><i class="fas fa-layer-group"></i></span>
        <h2 style="font-size:1.5rem;">${esc(g.label)}</h2>
      </div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${g.items.map((it) => `
        <a class="subject-link" href="${esc(it.link)}" target="_blank" rel="noopener">
          <span class="ico"><i class="fas ${esc(it.icon || "fa-book")}"></i></span>
          <span>${esc(it.subject)}</span>
        </a>`).join("")}
      </div>
    </div>`).join("\n");

  const body = `
<div class="page-header container" data-section="community">
  <div class="eyebrow"><i class="fas fa-people-group"></i> Community Resources</div>
  <h1>Community Resources</h1>
  <p>Hi there! Here you'll find the notes and study materials I used during my own studies. I hope they help you understand the concepts better and make your learning easier.</p>
</div>
<div class="container section-tight" data-reveal>
  <div class="section-grid" style="grid-template-columns:repeat(auto-fit, minmax(300px,1fr));">
    ${groupCards}
  </div>
</div>`;

  const html = renderPage({
    title: "Community Resources — " + site.name,
    description: "Notes and study materials shared with the community.",
    icon: "images/community_resourses/icon.svg",
    section: "community",
    activeKey: "community",
    depth: 1,
    body
  });
  writeOut("community_resourses/community_resourses.html", html);
}

/* ============================================================ */
function main() {
  buildHome();
  buildProjects();
  buildAcademic();
  buildSelfLearning();
  buildHobbies();
  buildAesthetic();
  buildCommunity();
  console.log("\nBuild complete.");
}

main();
