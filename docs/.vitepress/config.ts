import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'RxJS Knowledge Base',
  description: "Hans Schenker's RxJS knowledge hub — built together with Claude",
  base: '/netxpert-site/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Observables', link: '/observables/' },
      { text: 'Operators', link: '/operators/' },
      { text: 'Patterns', link: '/patterns/' },
    ],
    sidebar: [
      {
        text: 'Core Concepts',
        items: [
          {
            text: 'Observables',
            link: '/observables/',
            items: [
              { text: 'What Is an Observable?', link: '/observables/what-is-an-observable' },
            ],
          },
          { text: 'Operators', link: '/operators/' },
          { text: 'Observers', link: '/observers/' },
          { text: 'Subscriptions', link: '/subscriptions/' },
          { text: 'Subjects', link: '/subjects/' },
          { text: 'Schedulers', link: '/schedulers/' },
        ],
      },
      {
        text: 'Going Deeper',
        items: [
          { text: 'Custom Operators', link: '/custom-operators/' },
          { text: 'TypeScript', link: '/typescript/' },
          { text: 'Patterns', link: '/patterns/' },
        ],
      },
      {
        text: 'Craft',
        items: [
          { text: 'Tools', link: '/tools/' },
          { text: 'Testing', link: '/testing/' },
          { text: 'Debugging', link: '/debugging/' },
        ],
      },
    ],
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/hansschenker/netxpert-site' },
    ],
    outline: 'deep',
  },
})
