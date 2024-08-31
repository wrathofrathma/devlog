---
title: "Creating a custom template in Proxmox using a custom qcow2 disk image."
author: ["Rathma"]
date: 2024-08-26T00:00:00-04:00
lastmod: 2024-08-31T00:00:00-04:00
tags: ["moc", "proxmox", "virtualization"]
draft: false
---

## Overview {#overview}

There are times that containers such as docker containers or LXC might not provide the level of isolation required for certain tasks.

During those times, we might want to build an infrastructure that supports going wide with virtual machines, where instead of containers, we have custom images built elsewhere.

This is the use case this documentation/article is supporting and will walk through the steps required to integrate these custom images into the framework of Proxmox.


## Step 1. Acquire some .img or .qcow2 image {#step-1-dot-acquire-some-dot-img-or-dot-qcow2-image}

For example, I used a Ubuntu cloud image that we build and provision with a stack including Packer, Ansible, and Cloud-init.


## Step 2. Push the image to Proxmox {#step-2-dot-push-the-image-to-proxmox}

I used `scp` to securely copy the image to the root user's home directory on the Proxmox server.


## Step 3. Create a blank VM that will serve as a template {#step-3-dot-create-a-blank-vm-that-will-serve-as-a-template}

To automate this step as part of a script, we'll be launching the VMs programmatically.

```bash
qm create <VMID> --name <VM_NAME> --cpu cputype=host --cores 4 --memory 4096 --machine q35 --bios ovmf --net0 virtio,bridge=vmbr0 --vga std --boot c
qm set <VMID> --efidisk0 local-lvm:1
```

Breaking this command down

The first command sets up the initial VM hardware specifications:
`--cpu cputype=host` sets the CPU architecture to match the host.
`--cores 4` allocates 4 virtual CPUs to the VM.
`--memory 4096` allocates 4096 MB of RAM.
`--machine q35` specifies the machine type/chipset.
`--bios ovmf` sets the BIOS firmware to OVMF (UEFI).
`--net0 virtio,bridge=vmbr0` configures the first network device using VirtIO and bridges it to `vmbr0`.
`--vga std` sets the video device to standard VGA.
`--boot c` sets the boot order to prioritize the first disk.

The second command attaches a new EFI disk to the VM, as we're using UEFI firmware.

**Note:** You'll notice that we did not attach any hard disks to the VM at this stage.


## Step 4. Import the custom disk to the VM {#step-4-dot-import-the-custom-disk-to-the-vm}

Next, import the custom disk image into the VM's storage in Proxmox. This step copies the disk image to the storage associated with the VM but does not yet attach the disk to the VM.

```bash
qm importdisk <VMID> /root/custom-disk.img local-lvm
```


## Step 5. Attach the disk as a SCSI device {#step-5-dot-attach-the-disk-as-a-scsi-device}

After importing the custom disk image, the next step is to attach it to the VM as a SCSI device. We choose SCSI because it is well-supported by VirtIO, offering the best performance and compatibility for virtual machines.

```bash
qm set <VMID> --scsi0 local-lvm:vm-<VMID>-disk-0
```

This command links the imported disk image to the VM using the SCSI interface. The --scsi0 option specifies that the disk should be attached as the first SCSI device, and local-lvm:vm-&lt;VMID&gt;-disk-0 refers to the location of the disk in the local storage.


## Step 6. Convert to template {#step-6-dot-convert-to-template}

Once the disk is attached, the final step is to convert the VM into a template so that we can begin cloning and deploying wide. Although this conversion can be done wihtin the Proxmox GUI, in most cases this step will be done programatically at the end of some pipeline. So we're going to continue with that.

```nil
qm template <VMID>
```

This command converts the specified VM into a template, finalizing the process.
