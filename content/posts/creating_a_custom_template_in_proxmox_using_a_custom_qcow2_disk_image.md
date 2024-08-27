---
title: "Creating a custom template in Proxmox using a custom qcow2 disk image."
author: ["Rathma"]
date: 2024-08-26T00:00:00-04:00
lastmod: 2024-08-26T00:00:00-04:00
tags: ["moc"]
draft: false
---

## Overview {#overview}

There are times that containers such as docker containers or LXC might not provide the level of isolation required for certain tasks.

During those times, we might want to build an infrastructure that supports going wide with virtual machines, where instead of containers, we have custom images built elsewhere.

This is the use case this documentation/article is supporting and will walk through the steps required to accomplish this within the framework of Proxmox.


## Step 1. Acquire some .img or .qcow2 image {#step-1-dot-acquire-some-dot-img-or-dot-qcow2-image}

In my case, this was a ubuntu image that we provisioned with ansible and configure for cloud-init to deploy later.


## Step 2. Push the image to Proxmox {#step-2-dot-push-the-image-to-proxmox}

I used scp to copy the image over to the root user's home directory.

It exists now in /root/custom-image.img


## Step 3. Create a blank VM that will serve as a template {#step-3-dot-create-a-blank-vm-that-will-serve-as-a-template}

In order to make this part of a script, we're doing this all programatically

```bash
qm create <VMID> --name <VM_NAME> --cpu cputype=host --cores 4 --memory 4096 --machine q35 --bios ovmf --net0 virtio,bridge=vmbr0 --vga std --boot c
qm set <VMID> --efidisk0 local-lvm:1
```

Breaking this command down

The first command is installing / creating the intial VM hardware specs
--cpu is setting the CPU architecture to the same as the host
--cores is allocated vCPUs to the VM
--memory is allocated RAM in terms of MB
--machine q35 is setting the machine type/chipset
--bios ovmf is setting the BIOS firmware
--net0 is setting the first networking device to be the default vm bridge
--vga is setting the video device to basic VGA support
--boot is setting the boot order to the first disk

The second command is attaching new EFI disk to the VM since we're using UEFI firmware.

**Note:** You'll notice that we did not attach any hard disks to the VM


## Step 4. Import the custom disk to the VM {#step-4-dot-import-the-custom-disk-to-the-vm}

```bash
qm importdisk <VMID> /root/custom-disk.img local-lvm
```


## Step 5. Attach the disk as a SCSI device {#step-5-dot-attach-the-disk-as-a-scsi-device}

We use SCSI since that is the best supported by VirtIO

```bash
qm set <VMID> --scsi0 local-lvm:vm-<VMID>-disk-0
```


## Step 6. Convert to template {#step-6-dot-convert-to-template}

This can be done within the Proxmox GUI, but we can just convert the VM to a template now and we're basically finished.
