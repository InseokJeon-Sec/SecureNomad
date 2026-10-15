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

  url: 'https://wiki.securenomad.kr',
  baseUrl: '/',
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
        sitemap: {
          lastmod: 'date',             // 검색엔진에 문서 수정일 전달
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
        },
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
      metadata: [
        {name: 'keywords', content: '정보보안, 보안, 침해사고 대응, 보안관제, SOC, OT 보안, 클라우드 보안, ISMS, ISO 27001, 네트워크 보안, IT'},
        {name: 'author', content: 'Inseok Jeon'},
      ],
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
          {type: 'docSidebar', sidebarId: 'securitySidebar', position: 'left', label: 'Security'},
          {type: 'docSidebar', sidebarId: 'itSidebar', position: 'left', label: 'IT'},
          {to: '/about', label: 'About', position: 'right'},
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