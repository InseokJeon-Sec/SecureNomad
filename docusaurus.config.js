// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'SecureNomad',
  tagline: '보안과 IT 지식 정리',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://inseokjeon-sec.github.io',
  baseUrl: '/SecureNomad/',
  trailingSlash: false,

  organizationName: 'InseokJeon-Sec',
  projectName: 'SecureNomad',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'ko',
    locales: ['ko'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',          // 문서를 사이트 첫 화면으로
          sidebarPath: './sidebars.js',
          showLastUpdateTime: true,    // 문서 하단에 마지막 수정일 표시
        },
        blog: false,                   // 블로그 끄기
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'SecureNomad',
        logo: {
          alt: 'SecureNomad Logo',
          src: 'img/logo.svg',
        },
        items: [
          {type: 'docSidebar', sidebarId: 'securitySidebar', position: 'left', label: '보안'},
          {type: 'docSidebar', sidebarId: 'itSidebar', position: 'left', label: 'IT'},
          {type: 'docSidebar', sidebarId: 'buildSidebar', position: 'left', label: '구축 기록'},
          {
            href: 'https://github.com/InseokJeon-Sec/SecureNomad',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} SecureNomad. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'powershell', 'sql', 'http'],
      },
    }),
};

export default config;