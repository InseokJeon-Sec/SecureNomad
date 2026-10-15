// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

// 빌드 · 실행 중인 언어 (ko: 한국어, en: 영어)
const currentLocale = process.env.DOCUSAURUS_CURRENT_LOCALE ?? 'ko';
const isKorean = currentLocale === 'ko';

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
    locales: ['ko', 'en'],
    localeConfigs: {
      ko: {label: '한국어', htmlLang: 'ko-KR'},
      en: {label: 'English', htmlLang: 'en-US'},
    },
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
        blog: isKorean && {            // Notes (날짜순 이슈 메모, 한국어 전용)
          path: 'notes',
          routeBasePath: 'notes',
          blogTitle: 'Notes',
          blogDescription: '보안 · IT · AI 이슈를 그때그때 기록하는 메모',
          blogSidebarTitle: '최근 노트',
          blogSidebarCount: 'ALL',
          postsPerPage: 10,
          showReadingTime: true,
          showLastUpdateTime: true,
          authorsMapPath: 'authors.yml',
          tags: 'tags.yml',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
          feedOptions: {
            type: ['rss', 'atom'],
            title: 'SecureNomad Notes',
            description: '보안 · IT · AI 이슈 메모',
            language: 'ko',
          },
        },
        sitemap: {
          lastmod: 'date',             // 검색엔진에 문서 수정일 전달
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
        },
        gtag: {                        // Google Analytics 4 방문 통계
          trackingID: 'G-JM4LD4WP7D',
          anonymizeIP: true,
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
        {name: 'naver-site-verification', content: '0d19a96a355dc5842307a811d9a57ccf53438376'},
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
          {type: 'docSidebar', sidebarId: 'itSidebar', position: 'left', label: 'IT'},
          {type: 'docSidebar', sidebarId: 'securitySidebar', position: 'left', label: 'Security'},
          {type: 'docSidebar', sidebarId: 'aiSidebar', position: 'left', label: 'AI'},
          // Notes는 한국어 화면에서만 표시
          ...(isKorean ? [{to: '/notes', label: 'Notes', position: 'left'}] : []),
          {type: 'localeDropdown', position: 'right'},
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