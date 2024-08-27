import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4.0 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Garbage Collection",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "wrathofrathma.github.io/devlog",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
         // light: "#faf8f8",
         //  lightgray: "#e5e5e5",
         //  gray: "#b8b8b8",
         //  darkgray: "#4e4e4e",
         //  dark: "#2b2b2b",
         //  secondary: "#284b63",
         //  tertiary: "#84a59d",
         //  highlight: "rgba(143, 159, 169, 0.15)",
          // Background color
          // light: "#4f4f51",
          // light: "#1b1719",
          light: "#FFF2E1",
          // Search box background
          // Inline code block background
          // Graph edge color
          // Graph outline
          // Outline of code block?
          // <hr>
          // Background of search result article name
          lightgray: "#EAD8C0",
          // Date
          // How long an article is to read
          // Isoalted graph nodes
          gray: "#D1BB9E",
          // Pretty much all text
          // Article text
          // Search box text
          // Icon color for dark mode / lightmode
          // > dividers for Home > Posts > Article navigation (breadcrumbs?)
          darkgray: "#A79277",
          // Title
          // Basically all headers
          // - Explorer header
          // - Posts under explorer titles, but not the category
          // - Graph view header
          // - Backlinks header
          // - Article headers
          // - Table of contents of article
          // - Search result article names
          dark: "#8E785E",
          // Website title
          // Categories in explorer
          // Text color of breadcrumbs
          // Article tags
          // Links
          // Graph node that we're on
          secondary: "#B8A284",
          // Graph nodes we're not on
          // Text select color
          // Text hover color
          tertiary: "#C0AB90",
          // Tag background lol
          highlight: "#FFF2DA",
          // Unused from what I can tell
          textHighlight: "#888888",
        },
        darkMode: {
          // light: "#1e1e2e",
          // lightgray: "#313244",
          // gray: "#585b70",
          // darkgray: "#cdd6f4",
          // dark: "#f5c2e7",
          // secondary: "#f38ba8",
          // tertiary: "#94e2d5",
          // highlight: "#181825",  // Background of tags

          // Catpuccin blend with our dark mode
          light: "#1e1e2e",
          lightgray: "#2d3142",
          gray: "#6e738d",
          darkgray: "#cdd6f4",
          dark: "#f5e0dc",
          secondary: "#cba6f7",
          tertiary: "#b4befe",
          highlight: "#302d41",
          // Unused from what I can tell
          textHighlight: "#888888",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
      Plugin.OxHugoFlavouredMarkdown()
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
