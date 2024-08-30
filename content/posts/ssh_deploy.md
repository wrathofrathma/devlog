---
title: "ssh-deploy"
author: ["Rathma"]
date: 2024-08-28T00:00:00-04:00
lastmod: 2024-08-30T00:00:00-04:00
tags: ["moc", "emacs"]
draft: false
---

## Overview {#overview}

Within the [Emacs]({{< relref "emacs.md" >}}) ecosystem there is a plugin called `emacs-ssh-deploy` that allows a user to mirror a project between local files and directories to remote files via Tramp.

Some of the features I found particularly handy

-   Deploy changes from a local source to the remote project
-   Open a remote file locally for editing
-   Diff a local file against the remote version

While you can certainly (and should!) use version control to deploy code remotely, this kind of tool is extremely useful for both rapid development and system admins! The code we're deploying can also be system/program configurations.


## Setup {#setup}


### Installing Plugin {#installing-plugin}

In Doom Emacs this is as simple as just uncommenting it in the init.el

```diff
-       ;;upload            ; map local to remote projects via ssh/ftp
+       upload            ; map local to remote projects via ssh/ftp
```

Then running `doom sync` or reloading doom within emacs.


### Setting up a project for deployment {#setting-up-a-project-for-deployment}

If you have SSH authentication set up already for your target remote server, then remote deployment is super easy to set up.

In order to enable remote deployment for a project, we need to add a file to the project root that will define our configuration.

Following the examples in the github README, this is a fairly minimal example that will

-   configure local and remote project directories
-   set deployment to occur automatically on file save
-   make the operation asynchronous

`.dir-locals.el`

```elisp
((nil . (
         (ssh-deploy-root-local . "~/dev/some_project/")
         (ssh-deploy-root-remote . "/ssh:myuser@importantserver:/home/myuser/dev/some_project/")
         (ssh-deploy-on-explicit-save . 1)
         (ssh-deploy-async . 1)
         )))
```

**Important Note**: If we don't have a trailing `/` in the project roots, then the plugin will fail.


## Usage {#usage}

If we use my above `.dir-locals.el`, then deploying to remote is pretty transparent and just happens on-save.

A tl;dr of functionality I find useful, and their default bindings in Doom Emacs

-   Deploying to remote ssh-deploy-upload-handler (SPC r u)
-   Open remote version of file ssh-deploy-open-remote-file-handler (SPC r o)
-   Diff local and remote files ssh-deploy-diff-handler (SPC r x)
-   Browse remote files ssh-deploy-browse-remote-handler (SPC r .)


## Limitations {#limitations}

Among the limitations, the one I want to shine a spotlight on is the fact this plugin can only manage one remote at a time.

Thankfully it's pretty easy to just swap remotes in the `.dir-locals.el`


## References {#references}

-   <https://github.com/cjohansson/emacs-ssh-deploy>
