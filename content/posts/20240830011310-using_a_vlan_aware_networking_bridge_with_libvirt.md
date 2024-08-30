---
title: "Using a VLAN aware networking bridge with libvirt"
author: ["Rathma"]
date: 2024-08-30T00:00:00-04:00
lastmod: 2024-08-30T00:00:00-04:00
tags: ["moc", "libvirt", "virtualization"]
draft: false
---

## Overview {#overview}

By default, the linux bridges that libvirt and qemu use don't support VLAN tagging. However there are other bridge softwares, such as Open vSwitch, which is what popular hypervisor [Proxmox]({{< relref "20240830011532-proxmox.md" >}}) uses.

This post isn't meant to be a tutorial, but rather my experience setting up the networking bridge and some options for integrating it into VM deployment.


## Bridge Setup {#bridge-setup}


### 1. Remove the default network bridge and VM bridge {#1-dot-remove-the-default-network-bridge-and-vm-bridge}

This step is probably not necessary, as you can have multiple bridges, but I wanted to re-use the network device name and IP.

****Important****: If you do plan on removing the old bridge, make sure to do it in this order or else you will break your networking.


#### Undefine the VM bridge in libvirt {#undefine-the-vm-bridge-in-libvirt}

We want to remove our bridge network within libvirt before altering the device it's attached to.

This is simple, as we just want to bring the network down and undefine it (we will be redefining it later).

```bash
virsh net-destroy br0
virsh net-undefine br0
```


#### Undefine the bridge device {#undefine-the-bridge-device}

If you use netplan, the first thing we have to do is edit our netplan network xml to

-   Ensure the interface the bridge will be communicating over is set to not use dhcp
-   Delete the previous bridge definition.

<!--listend-->

```diff
network:
  renderer: networkd
  ethernets:
    enp65s0f1:
      dhcp4: no
-  bridges:
-    br0:
-      interfaces:
-        - enp65s0f1
-      addresses:
-        - internal_ip/24
-      gateway4: internal_gateway
-      nameservers:
-        addresses:
-          - 8.8.8.8
-          - 8.8.4.4
```

Now we can remove the bridge and apply our new netplan configuration.

Very important to bring the current bridge down before we apply the new netplan. Otherwise your networking may break as mine did multiple times.

```bash
ip link set dev br0 down
ip link delete br0 type bridge
netplan apply
```


### 2. Define the new bridge with openvswitch {#2-dot-define-the-new-bridge-with-openvswitch}

Referencing the instructions in [Open vSwitch's Documentation](https://docs.openvswitch.org/en/latest/howto/vlan/).

Create the OVS bridge device

```bash
ovs-vsctl add-br br0
```

Add your networking device to it, mine is my secondary NIC named `enp65s0f1`

```bash
ovs-vsctl add-port br0 enp65s0f1
```

Lastly, set the device to be up

```bash
ip link set br0 up
```


### 3. Define the bridge in libvirt {#3-dot-define-the-bridge-in-libvirt}

Defining the bridge in libvirt has some nuance. As you can accidentally block traffic over your native VLAN with a misconfiguration.

The way we define a bridge network in libvirt is by creating an XML file with its configuration in it, and running `virsh net-define mynetwork.xml`.

A minimal example setting up one VLAN on VLAN ID 15.
`ovsnet.xml`

```xml
<network>
        <name>br0</name>
        <forward mode='bridge'/>
        <bridge name='br0'/>
        <virtualport type='openvswitch'/>
        <portgroup name='native' default='yes'/>
        <portgroup name='VLAN15'>
                <vlan>
                        <tag id='15'/>
                </vlan>
        </portgroup>
</network>
```

An important part of the above bridge configuration, is that we do not configure trunking. If we do that, we will have successfully created a bridge where we can put things onto VLAN15, but we lose access to the native VLAN.

This happens because the interface will auto-tag all interfaces created on the bridge with the tag for the native VLAN, but traffic tagged for our native VLAN doesn't flow.

****Note:**** The above warning may not apply to your setup, but it broke mine for the aforementioned reason.

Once we have our file, we can define the network.

```bash
virsh net-define ovsnet.xml
```

Then start our VM network and enable it to autostart

```bash
virsh net-start br0
virsh net-autostart br0
```


### 4. Firewall or router configuration {#4-dot-firewall-or-router-configuration}

This step is highly dependent on your networking setup, but in some situations you may need to whitelist VLAN traffic over the physical NIC of the hypervisor within your router.


## Launching a VM with the bridge {#launching-a-vm-with-the-bridge}

There is one difference to note about launching a VM on the new bridge, whether we're doing VLAN tagging or not. That difference is we need the device to be of type network instead of bridge for ovs' bridge to work properly. If we fail to make this change, then your hypervisor will complain that adding a new port to the network bridge is not a supported operation.

With `virt-install`, a normal linux bridge can be added with

```bash
--network bridge=br0,model=virtio
```

We need to change this to

```bash
--network type=network,source=br0,model=virtio
```

Once we launch a virtual machine with this setting, we can verify that our VM is successfully added to the OVS bridge by checking that the virtual net device was added as a port to our bridge

```bash
ovs-vsctl show
```

Then also we can check our vnet device is correctly linked

```bash
virsh domiflist $VMNAME
```


## Tagging the VLAN of a Virtual Machine {#tagging-the-vlan-of-a-virtual-machine}

There are two methods of tagging the VM traffic for a specific VLAN

-   Persistent applicaton (XML editing)
-   Runtime application
    -   manual tagging
    -   pre-boot hook


### XML editing {#xml-editing}

There are two ways we can access the XML for our virtual machine definition

1.  Install the virtual machine with `virt-install` and shut it down so we can edit the configuration with `virsh edit $VM`
2.  Pass the `--print-xml` argument to `virt-install` with no installation options so we get the XML before the VM is defined. Then define the VM later with `virsh define myvm.xml`

In any case, after we have access to the XML for a VM, we need to find this section for our network interface, there may be an address section as well.

```xml
<interface type="network>
  <source network="br0"/>
  <model type="virtio"/>
  <mac address="SOME_MAC_ADDR"/>
</interface>
```

To tag traffic for our custom VLAN, we need to inject the VLAN with two lines

-   one telling the interface that we're using openvswitch ports
-   the other defining the VLAN tag id we're targetting

<!--listend-->

```xml
<interface type="network>
  <source network="br0"/>
  <model type="virtio"/>
  <mac address="SOME_MAC_ADDR"/>
  <virtualport type='openvswitch/>
  <vlan>
    <tag id='15'/>
  </vlan>
</interface>
```

Once that's added, we should be able to either boot or define the VM and it'll persistently be on the correct VLAN :D


### Manually tagging the VLAN of the interface {#manually-tagging-the-vlan-of-the-interface}

Once a virtual machine is running, we should see a `vnetXX` networking device on our hypervisor that corresponds with that virtual machine. Let's say it's vnet29.

We can tag all traffic on vnet29 to use port15 with the following command

```bash
ovs-vsctl set Port vnet29 tag=15
```


### pre-boot hook {#pre-boot-hook}

Libvirt supports hooks before many operations, one of them being `pre-boot`. We can inject code for after the networking device is created, but before the domain is booted.

This is done by placing a file under `/etc/libvirt/hooks`

We can use the same method as manually setting the VLAN here if we know the VLAN ahead of time. The downside is this solution is not very flexible since we can't have the VLAN be variable.

This pre-boot hook script will

-   find the vnet ID for the booting virtual machine
-   set the interface to VLAN15

<!--listend-->

```bash
#!/bin/bash

VM_NAME=$1
ACTION=$2

if [ "$ACTION" = "prepare" ]; then
    # Find the vnet interface associated with the VM
    INTERFACE=$(virsh domiflist "$VM_NAME" | grep -oP 'vnet\d+')

    if [ -n "$INTERFACE" ]; then
        # Apply VLAN tag to the vnet interface
        sudo ovs-vsctl set Port "$INTERFACE" tag=15
        echo "Applied VLAN tag 15 to $INTERFACE for VM $VM_NAME"
    else
        echo "No vnet interface found for VM $VM_NAME"
    fi
fi
```


## References {#references}

-   <https://docs.openvswitch.org/en/latest/howto/vlan/>
    Documentation that we're following
-   <https://docs.openvswitch.org/en/latest/faq/vlan/>
    VLAN FAQ
-   <https://www.redhat.com/sysadmin/libvirt-open-vswitch>
    Instructions for using libvirt with open vswitch on redhat
-   <https://manintheit.org/2019/12/17/creating-vlans-on-kvm-with-openvswitch/>
    Someone's experience setting up vlans with ovs vswitch
-   <https://forums.debian.net/viewtopic.php?t=157191>
    Forum post on someone setting up vlans with libvirt and open vswitch
-   <https://docs.openvswitch.org/en/stable/howto/libvirt/>
    Open vSwitch's documentation on integrating with libvirt
