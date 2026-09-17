export type Template = { id: string; label: string; description: string; text: string };

/** README widgets modeled after github-readme generators (shields.io + github-readme-stats). */
export const TEMPLATES: Template[] = [
  {
    id: 'profile-header',
    label: 'Profile Header',
    description: 'Title + tagline + visitor/follower badges',
    text: '# Hi there, I\'m Your Name 👋\n\nA short tagline about what you build or love working on.\n\n![Visitors](https://komarev.com/ghpvc/?username=your-username&color=blue)\n![Followers](https://img.shields.io/github/followers/your-username?label=Follow&style=social)',
  },
  {
    id: 'skill-badges',
    label: 'Skill Badges',
    description: 'Row of shields.io language/tool badges',
    text: '![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)\n![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)\n![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)\n![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)',
  },
  {
    id: 'stats-card',
    label: 'GitHub Stats',
    description: 'Commit/PR/issue stats card',
    text: '![GitHub Stats](https://github-readme-stats.vercel.app/api?username=your-username&show_icons=true&theme=dark)',
  },
  {
    id: 'top-langs',
    label: 'Top Languages',
    description: 'Most-used languages breakdown',
    text: '![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=your-username&layout=compact&theme=dark)',
  },
  {
    id: 'streak-stats',
    label: 'Contribution Streak',
    description: 'Current streak + total contributions',
    text: '![GitHub Streak](https://streak-stats.demolab.com?user=your-username&theme=dark)',
  },
  {
    id: 'trophies',
    label: 'Profile Trophies',
    description: 'Achievement trophy row',
    text: '![Trophies](https://github-profile-trophy.vercel.app/?username=your-username&theme=onedark&no-frame=true&row=1)',
  },
  {
    id: 'social-badges',
    label: 'Social Links',
    description: 'Twitter / LinkedIn / blog badges',
    text: '[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?logo=twitter&logoColor=white)](https://twitter.com/your-handle)\n[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?logo=linkedin&logoColor=white)](https://linkedin.com/in/your-handle)\n[![Blog](https://img.shields.io/badge/Blog-black?logo=hashnode&logoColor=white)](https://your-blog.example.com)',
  },
  {
    id: 'featured-repo',
    label: 'Featured Project',
    description: 'Repo card with description + star/fork badges',
    text: '### 🚀 [project-name](https://github.com/your-username/project-name)\n\nOne-line description of what this project does and why it matters.\n\n![Stars](https://img.shields.io/github/stars/your-username/project-name?style=flat)\n![Forks](https://img.shields.io/github/forks/your-username/project-name?style=flat)\n![License](https://img.shields.io/github/license/your-username/project-name)',
  },
];
