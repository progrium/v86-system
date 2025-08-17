# v86-system

```
v86-system v0.1.0
Command-line v86 runner with QEMU-compatible flags

Usage:
  v86-system-i386 [options]

Standard options:
  -h, --help            Show help
  -v, --version         Show version

Memory options:
  -m SIZE               Set memory size (default: 512M)
  -vga-mem SIZE         Set VGA memory size (default: 8M)

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
  -bios FILE            BIOS image file
  -vga-bios FILE        VGA BIOS image file
  -acpi                 Enable ACPI (default: off)
  -fastboot             Enable fast boot

V86 specific options:
  -autostart            Start emulation automatically (default: on)
  -disable-keyboard     Disable keyboard input
  -disable-mouse        Disable mouse input
  -disable-speaker      Disable speaker output
  -log-level LEVEL      Set logging level (0-3)

Examples:
  v86-system-i386 -hda disk.img
  v86-system-i386 -m 1G -hda disk.img -cdrom boot.iso
  v86-system-i386 -kernel vmlinuz -initrd initrd.img -append "console=ttyS0"
```

## Install



## Examples

### Basic VM with memory and disk
```bash
# QEMU style
v86-system-i386 -m 1G -hda disk.img
```

### Boot from CD-ROM
```bash
v86-system-i386 -m 512M -hda disk.img -cdrom install.iso -boot d
```

### Linux kernel boot
```bash
v86-system-i386 -kernel vmlinuz -initrd initrd.img -append "console=ttyS0 root=/dev/sda1"
```

### System options
```bash
v86-system-i386 -hda disk.img -acpi -fastboot
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

## V86-Specific Options

Additional options specific to the V86 emulator:

- `--vga-mem SIZE`: Set VGA memory size
- `--disable-keyboard`: Disable keyboard input
- `--disable-mouse`: Disable mouse input  
- `--disable-speaker`: Disable speaker output
- `--autostart`: Start emulation automatically (default: on)
- `--fastboot`: Enable fast boot
- `--log-level LEVEL`: Set logging level (0-3)

## License

MIT