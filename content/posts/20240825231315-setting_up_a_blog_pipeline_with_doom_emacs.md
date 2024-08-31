---
title: "Setting up a blog pipeline with doom emacs"
author: ["Rathma"]
date: 2024-08-26T00:00:00-04:00
lastmod: 2024-08-31T00:00:00-04:00
tags: ["moc", "emacs"]
draft: false
---

## Overview {#overview}

This post serves as personal documentation on the steps I took to configure this blog pipeline. While all of this information is already publicly available, I hope it might also help someone else by providing a consolidated reference.

The pipeline operates as follows:

1.  Posts are written within Emacs, in org-mode using org-roam for note management
2.  Ox-hugo exports our posts from `.org` to `.md` and places them in the blog project folder
3.  Changes are pushed to Github via git
4.  Quartz + Github Pages will statically render the website


## Why org-mode? Why not obsidian? {#why-org-mode-why-not-obsidian}

Honestly, there are many other solutions that are more convenient and work perfectly fine. I've even used a few of them and over the years have gone back and forth between note taking softwares, org-mode, notion, obsidian, etc. However I always find myself returning to org-mode.

What keeps bringing me back to org-mode is the integration and ease of searching my notes from within the same editor that I use for development. This makes development and note taking far more convenient.

It's even better that it supports powerful note linking in a similar way as Obsidian.


## What is org-roam (tl;dr)? {#what-is-org-roam--tl-dr}

Their github README.md does a good job of describing the overview of org-roam.

> Org-roam is a plain-text knowledge management system. It brings some of Roam's more powerful features into the Org-mode ecosystem.
>
> Org-roam borrows principles from the Zettelkasten method, providing a solution for non-hierarchical note-taking. It should also work as a plug-and-play solution for anyone already using Org-mode for their personal wiki.

<https://github.com/org-roam/org-roam>
<https://zettelkasten.de/overview/>


## Installation {#installation}


### ox-hugo {#ox-hugo}

Installing ox-hugo within Doom Emacs is straightfoward. Just enable the `+hugo` flag on org in your `init.el` within your emacs config.

```elisp
(org                ; organize your plain life in plain text
        +hugo              ; Huge export
        +roam2)            ; Enables integration with org-roam v2
```

After that, run `doom sync` to install the package.


### quartz {#quartz}

Quartz can be set up quickly. Below is the installation process, adapted from their  [getting started page.](https://quartz.jzhao.xyz/#-get-started%20)

```bash
git clone https://github.com/jackyzha0/quartz.git
cd quartz
npm i
npx quartz create
```

During the setup, you'll be prompted to configure a few options

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

The biggest decision we have to make within the ox-hugo configuration is how you want to store your posts. Ox-hugo provides two options

1.  Treat each major heading in a file as a separate post
2.  Treat each file as a separate post

Since I prefer org-roam, I've set up my org-roam directory to treat each file as a separate post.

This configuration can live within your main Emacs configuration, but that will also apply the settings to ALL org mode files everywhere.

The preferred method is using directory-local configuration by creating a `.dir-locals.el` within our org-roam directory. Whenever we edit a file within this directory, Emacs will use whatever settings we define there.

I placed the following `.dir-locals.el` file in the root of my org-roam directory.

```elisp
((org-mode .(
            (eval . (org-hugo-auto-export-mode))     ;; Enable auto-exporting on saving .org files
            (org-hugo-base-dir . "~/dev/devlog/")    ;; Set the directory root of the hugo project.
            (org-hugo-front-matter-format . "yaml")  ;; Format of the front-matter in the exported file.
             )))
```

With my `org-hugo-base-dir` set to `~/dev/devlog`, I can expect exported files to be generated into `~/dev/devlog/content/{catgory}`


### Writing files to not be exported {#writing-files-to-not-be-exported}

To prevent specific files in org-roam from being exported, you can add the heading `#+hugo_tags: noexport` to any org file.

Many users configure their org-roam capture templates to include this heading by default. I borrowed the capture template and auto-update of timestamp code from <https://www.asterhu.com/post/20240220-publish-org-roam-with-quartz-oxhugo>

The only change I made to their setup was retaining the timestamp in the filename.

If you add the following snippet to your emacs' `config.el`, whenever we create a new org-roam file, we will have hugo related headers already set for us, and the timestamp will be updated whenever we save a file.

```elisp
;; Configure org-roam template]
(setq org-roam-capture-templates
      '(("o" "moc" plain
         "\n%?\n\n"
         :if-new (file+head "%<%Y%m%d%H%M%S>-${slug}.org" "#+title: ${title}\n#+filetags: :moc:\n#+hugo_section: posts\n#+date: %u\n#+hugo_lastmod: %u\n#+hugo_tags: noexport\n")
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

Deploying to GitHub Pages is straightforward. I followed the instructions provided by the Quartz team <https://quartz.jzhao.xyz/hosting>

Key steps:

1.  Add their `deploy.yml` to the `project/.github/workflows/deploy.yml` to automatically build the website on commit
2.  In the settings of the GitHub project, under "Pages", set the "Source" to "Github Actions"


## References {#references}

-   <https://ox-hugo.scripter.co/doc/auto-export-on-saving/>
    ox-hugo autosaving
-   <https://www.asterhu.com/post/20240220-publish-org-roam-with-quartz-oxhugo>
    Someone else's experience setting up this same pipeline
-   <https://quartz.jzhao.xyz/#-get-started>
    Getting started with quartz
