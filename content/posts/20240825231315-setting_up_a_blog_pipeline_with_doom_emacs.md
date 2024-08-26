---
title: "Setting up a blog pipeline with doom emacs"
author: ["Christopher Arausa"]
date: 2024-08-26T00:00:00-04:00
lastmod: 2024-08-26T00:00:00-04:00
tags: ["moc"]
draft: false
---

## Overview {#overview}

This is my personal documentation on the steps I took to configure a blog pipeline for

-   writing posts in org-roam
-   exporting posts to markdown with ox-hugo
-   uploading the content with git
-   rendering a static website with quartz


## Installation {#installation}


### ox-hugo {#ox-hugo}

Since I'm using doom emacs, installation is as simple as enabling the +hugo flag in your `.init.el`

```elisp
(org                ; organize your plain life in plain text
        +hugo              ; Huge export
        +roam2)            ; Enables integration with org-roam v2
```

Then running `doom sync` to get the package installed.


### quartz {#quartz}

Quartz can be installed very quickly. This snippet is from their [getting started page.](https://quartz.jzhao.xyz/#-get-started%20)

```bash
git clone https://github.com/jackyzha0/quartz.git
cd quartz
npm i
npx quartz create
```

The command will walk you through a few questions

-   Choose how to initialize the content in '/path/to/content'
    -   Empty Quartz
-   Choose how Quartz should resolve links in your content. This should match Obsidian's link format.
    -   Treat links as shortest path (I actually don't know what would be better here yet.)

The modified version of those commands for my setup looks like

```bash
git clone https://github.com/jackyzha0/quartz.git ~/dev/devlog
cd ~/dev/devlog
npm i
npx quartz create
```


## Configuration {#configuration}


### ox-hugo configuration {#ox-hugo-configuration}

ox-hugo can be configured to either

1.  treat each major heading in a file as a separate post
2.  treat each file as a separate post

Since I prefer org-roam, I am setting up my org-roam directory to treat each file as a separate post.

By default ox-hugo looks for a `.dir-locals.el` file within the project root or directory root of any org file.

I placed the following `.dir-locals.el` file in the root of my org-roam directory.

```elisp
((org-mode .(
            (eval . (org-hugo-auto-export-mode))     ;; Enable auto-exporting on saving .org files
            (org-hugo-base-dir . "~/dev/devlog/")    ;; Set the directory root of the hugo project.
            (org-hugo-front-matter-format . "yaml")  ;; Format of the front-matter in the exported file.
             )))
```

With my `org-hugo-base-dir` set to `~/dev/devlog`, I can expect exported files to be generated into `~/dev/devlog/content/posts`


### Writing files to not be exported {#writing-files-to-not-be-exported}

To flag files in org-roam to not be exported, you can add the heading `#+hugo_tags: noexport` to any org file.

Most people configure capture templates for org-roam to just include this heading by default. I have stolen the capture templates and auto update of timestamp code from
<https://www.asterhu.com/post/20240220-publish-org-roam-with-quartz-oxhugo>

```elisp
;; Configure org-roam template]
(setq org-roam-capture-templates
      '(("o" "moc" plain
         "\n%?\n\n"
         :if-new (file+head "${slug}.org" "#+title: ${title}\n#+filetags: :moc:\n#+hugo_section: posts\n#+date: %u\n#+hugo_lastmod: %u\n#+hugo_tags: noexport\n")
         :immediate-finish t
         :unnarrowed t
         :empty-lines-after 1)))

;; Update last modified date for ox-hugo export
(after! org
  (setq time-stamp-active t
        time-stamp-start "#\\+hugo_lastmod:[ \t]*"
        time-stamp-end "$"
        time-stamp-format "\[%Y-%m-%d\]")
  (add-hook 'before-save-hook 'time-stamp))
```


### Deploying to github pages {#deploying-to-github-pages}

<https://quartz.jzhao.xyz/hosting>


## References {#references}

-   <https://ox-hugo.scripter.co/doc/auto-export-on-saving/>
    ox-hugo autosaving
-   <https://www.asterhu.com/post/20240220-publish-org-roam-with-quartz-oxhugo>
    Someone else's experience setting up this same pipeline
-   <https://quartz.jzhao.xyz/#-get-started>
    Getting started with quartz
