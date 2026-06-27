import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<section id="center">
  <div>
    <h1>Hans Schenker</h1>
    <p>RxJS courses, libraries, and open-source TypeScript projects</p>
  </div>
</section>

<div class="ticks"></div>

<section id="projects">
  <div id="projects-header">
    <h2>RxJS Projects</h2>
    <p>Courses and tools for mastering reactive programming with RxJS 7 and TypeScript</p>
  </div>
  <ul class="project-list">
    <li class="project-card">
      <div class="project-meta">
        <span class="project-tag">Course</span>
        <span class="project-tag">RxJS 7</span>
        <span class="project-tag">TypeScript</span>
      </div>
      <h3 class="project-title">RxJS Deep Dive</h3>
      <p class="project-desc">A 16-module course covering reactive architecture, operator policies, flattening strategies, and state streams. Central thesis: the domain can change — the RxJS machine stays the same.</p>
      <ul class="project-links">
        <li><a href="https://hansschenker.github.io/rxjs-deep-dive-course/" target="_blank" rel="noopener">Documentation</a></li>
        <li><a href="https://github.com/hansschenker/rxjs-deep-dive-course" target="_blank" rel="noopener">GitHub</a></li>
      </ul>
    </li>
  </ul>
</section>

<div class="ticks"></div>

<section id="next-steps">
  <div id="social">
    <svg class="icon" role="presentation" aria-hidden="true"><use href="/icons.svg#social-icon"></use></svg>
    <h2>Connect</h2>
    <p>Find me on GitHub</p>
    <ul>
      <li>
        <a href="https://github.com/hansschenker" target="_blank" rel="noopener">
          <svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#github-icon"></use></svg>
          @hansschenker
        </a>
      </li>
    </ul>
  </div>
</section>

<div class="ticks"></div>
<section id="spacer"></section>
`
