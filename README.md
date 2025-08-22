# v86-system

```
v86-system v0.4.0
Command-line v86 runner with QEMU-compatible flags

Usage:
  v86-system [options]

Memory options:
  -m SIZE               Set memory size (default: 512M)

Storage options:
  -hda FILE             Primary hard disk image
  -hdb FILE             Secondary hard disk image
  -fda FILE             Floppy disk A image
  -fdb FILE             Floppy disk B image
  -cdrom FILE           CD-ROM image

Boot options:
  -boot ORDER           Boot order (a,b,c,d,n) (default: c)
  -kernel FILE          Linux kernel image (bzImage)
  -initrd FILE          Initial ramdisk image
  -append STRING        Kernel command line

System options:
  -bios FILE            BIOS image file (default: seabios)
  -acpi                 Enable ACPI (default: off)
  -fastboot             Enable fast boot

Network options:
  -netdev CONFIG        Network device configuration

VirtFS options:
  -virtfs CONFIG        VirtFS configuration

Standard options:
  -h, --help            Show help
  -v, --version         Show version

Examples:
  v86-system -hda disk.img
  v86-system -m 1G -hda disk.img -cdrom boot.iso
  v86-system -kernel vmlinuz -initrd initrd.img -append "console=ttyS0"
  v86-system -hda disk.img -netdev user,type=virtio,relay_url=ws://localhost:8777

```

## Install

```bash
npm i -g v86-system
```

## QEMU Flag Mappings

| QEMU Flag | V86 Option | Description |
|-----------|------------|-------------|
| `-m SIZE` | `memory_size` | Memory size (supports K, M, G, T suffixes) |
| `-hda FILE` | `hda` | Primary hard disk |
| `-hdb FILE` | `hdb` | Secondary hard disk |
| `-cdrom FILE` | `cdrom` | CD-ROM image |
| `-fda FILE` | `fda` | Floppy disk A |
| `-fdb FILE` | `fdb` | Floppy disk B |
| `-kernel FILE` | `bzimage` | Linux kernel image |
| `-initrd FILE` | `initrd` | Initial ramdisk |
| `-append STRING` | `cmdline` | Kernel command line |
| `-bios FILE` | `bios` | BIOS image |
| `-acpi` | `acpi` | Enable ACPI |
| `-netdev user,CONFIG` | `net_device` | Enable user-mode networking |
| `-virtfs proxy,URL` | `filesystem.proxy_url` | VirtFS 9P WebSocket proxy |


## Examples

### Basic VM with memory and disk
```bash
v86-system -m 1G -hda disk.img
```

### Boot from CD-ROM
```bash
v86-system -m 512M -hda disk.img -cdrom install.iso -boot d
```

### Linux kernel boot
```bash
v86-system -kernel vmlinuz -initrd initrd.img -append "console=ttyS0 root=/dev/sda1"
```

### Network options
```bash
v86-system -hda disk.img -netdev user,type=virtio,relay_url=ws://localhost:8777
```

### Boot from 9P (over WebSocket)
```bash
v86-system -kernel vmlinuz -virtfs proxy,ws://localhost:7654 -append "console=ttyS0 rw root=host9p rootfstype=9p rootflags=trans=virtio,version=9p2000.L,aname=rootfs"
```

This assumes a 9P2000 WebSocket server is running with a root filesystem under `rootfs`. 

## License

MIT