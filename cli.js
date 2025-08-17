#!/usr/bin/env node

import { parseArgs } from 'util';
import pkg from './package.json' with { type: 'json' };
import path from "node:path";
import url from "node:url";
import { V86 } from "./assets/libv86.mjs";

const assetsDir = url.fileURLToPath(new URL("./assets", import.meta.url));

// Helper function to show help
function showHelp() {
  console.log(`${pkg.name} v${pkg.version}`);
  console.log(pkg.description);
  console.log('');
  console.log('Usage:');
  console.log('  v86-system-i386 [options]');
  console.log('');
  console.log('Standard options:');
  console.log('  -h, --help            Show help');
  console.log('  -v, --version         Show version');
  console.log('');
  console.log('Memory options:');
  console.log('  -m SIZE               Set memory size (default: 512M)');
  console.log('  -vga-mem SIZE         Set VGA memory size (default: 8M)');
//   console.log('');
//   console.log('CPU options:');
//   console.log('  --smp N                Number of CPUs (default: 1)');
  console.log('');
  console.log('Storage options:');
  console.log('  -hda FILE             Primary hard disk image');
  console.log('  -hdb FILE             Secondary hard disk image');
  console.log('  -fda FILE             Floppy disk A image');
  console.log('  -fdb FILE             Floppy disk B image');
  console.log('  -cdrom FILE           CD-ROM image');
  console.log('');
  console.log('Boot options:');
  console.log('  -boot ORDER           Boot order (a,b,c,d,n) (default: c)');
  console.log('  -kernel FILE          Linux kernel image (bzImage)');
  console.log('  -initrd FILE          Initial ramdisk image');
  console.log('  -append STRING        Kernel command line');
  console.log('');
  console.log('System options:');
  console.log('  -bios FILE            BIOS image file');
  console.log('  -vga-bios FILE        VGA BIOS image file');
  console.log('  -acpi                 Enable ACPI (default: off)');
  console.log('  -fastboot             Enable fast boot');
//   console.log('');
//   console.log('Display options:');
//   console.log('  --nographic            Disable graphics, use serial console');
//   console.log('');
//   console.log('Network options:');
//   console.log('  --netdev CONFIG        Network device configuration');
  console.log('');
  console.log('V86 specific options:');
  console.log('  -autostart            Start emulation automatically (default: on)');
  console.log('  -disable-keyboard     Disable keyboard input');
  console.log('  -disable-mouse        Disable mouse input');
  console.log('  -disable-speaker      Disable speaker output');
  console.log('  -log-level LEVEL      Set logging level (0-3)');
  console.log('');
  console.log('Examples:');
  console.log('  v86-system -hda disk.img');
  console.log('  v86-system -m 1G -hda disk.img -cdrom boot.iso');
  console.log('  v86-system -kernel vmlinuz -initrd initrd.img -append "console=ttyS0"');
  console.log('');
}

// Helper function to show version
function showVersion() {
  console.log(pkg.version);
}

// Helper function to parse memory size strings like "512M", "1G", etc.
function parseMemorySize(sizeStr) {
  if (!sizeStr) return null;
  
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)([KMGT]?)$/i);
  if (!match) {
    throw new Error(`Invalid memory size format: ${sizeStr}`);
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  const multipliers = {
    '': 1024 * 1024, // Default to MB if no unit
    'B': 1,
    'K': 1024,
    'M': 1024 * 1024,
    'G': 1024 * 1024 * 1024,
    'T': 1024 * 1024 * 1024 * 1024,
  };
  
  return Math.floor(value * multipliers[unit]);
}

// Helper function to create V86Image objects
function createV86Image(filePath) {
  if (!filePath) return undefined;
  return { url: path.resolve(filePath) };
}

// Helper function to parse boot order
function parseBootOrder(bootStr) {
  const bootMap = {
    'a': 0x01, // Floppy A
    'b': 0x02, // Floppy B  
    'c': 0x80, // Hard disk
    'd': 0x81, // CD-ROM
    'n': 0x82, // Network
  };
  
  // For now, just return the first boot device
  // V86 uses different boot order values than qemu
  const firstChar = bootStr?.charAt(0);
  return bootMap[firstChar] || 0x80; // Default to hard disk
}

function normalizeArgs(argv) {
    return argv.map(arg =>
      arg.startsWith("-") &&
      !arg.startsWith("--") &&
      arg.length > 2
        ? "--" + arg.slice(1)   // turn `-name` into `--name`
        : arg
    );
  }

// Parse command line arguments using built-in Node.js parseArgs
const { values } = parseArgs({
  args: normalizeArgs(process.argv.slice(2)),
  options: {
    help: {
        type: 'boolean',
        short: 'h',
    },
    version: {
        type: 'boolean',
        short: 'v',
    },
    // Memory options
    mem: {
        short: 'm',
        type: 'string',
        default: '512M',
    },
    'vga-mem': {
      type: 'string',
      default: '8M',
    },
    // Storage options
    hda: {
      type: 'string',
    },
    hdb: {
      type: 'string',
    },
    fda: {
      type: 'string',
    },
    fdb: {
      type: 'string',
    },
    cdrom: {
      type: 'string',
    },
    // Boot options
    boot: {
      type: 'string',
      default: 'c',
    },
    kernel: {
      type: 'string',
    },
    initrd: {
      type: 'string',
    },
    append: {
      type: 'string',
    },
    // System options
    bios: {
      type: 'string',
    },
    'vga-bios': {
      type: 'string',
    },
    acpi: {
      type: 'boolean',
      default: false,
    },
    // Display options
    nographic: {
      type: 'boolean',
      default: false,
    },
    // Network options
    netdev: {
      type: 'string',
    },
    // V86 specific options
    autostart: {
      type: 'boolean',
      default: true,
    },
    'disable-keyboard': {
      type: 'boolean',
      default: false,
    },
    'disable-mouse': {
      type: 'boolean',
      default: false,
    },
    'disable-speaker': {
      type: 'boolean',
      default: false,
    },
    fastboot: {
      type: 'boolean',
      default: false,
    },
    // Debug options
    'log-level': {
      type: 'string',
      default: '0',
    },
  },
});

// Execute based on flags
if (values.help) {
    showHelp();
} else if (values.version) {
    showVersion();
} else {
    // Build V86 configuration from command line arguments
    const config = {
        wasm_path: path.join(assetsDir, "v86.wasm"),
        autostart: values.autostart,
    };
    
    // Memory configuration
    const memorySize = parseMemorySize(values.mem);
    if (memorySize) {
        config.memory_size = memorySize;
    }
    
    const vgaMemorySize = parseMemorySize(values['vga-mem']);
    if (vgaMemorySize) {
        config.vga_memory_size = vgaMemorySize;
    }
    
    // BIOS configuration
    const biosPath = values.bios || path.join(assetsDir, "seabios.bin");
    config.bios = { url: biosPath };
    
    const vgabiosPath = values['vga-bios'] || path.join(assetsDir, "vgabios.bin");
    config.vga_bios = { url: vgabiosPath };

    // Storage configuration
    if (values.hda) {
        config.hda = createV86Image(values.hda);
    }
    
    if (values.hdb) {
        config.hdb = createV86Image(values.hdb);
    }
    
    if (values.fda) {
        config.fda = createV86Image(values.fda);
    }
    
    if (values.fdb) {
        config.fdb = createV86Image(values.fdb);
    }
    
    if (values.cdrom) {
        config.cdrom = createV86Image(values.cdrom);
    }
    
    // Boot configuration
    if (values.kernel) {
        config.bzimage = createV86Image(values.kernel);
    }
    
    if (values.initrd) {
        config.initrd = createV86Image(values.initrd);
    }
    
    if (values.append) {
        config.cmdline = values.append;
    }
    
    if (values.boot && values.boot !== 'c') {
        config.boot_order = parseBootOrder(values.boot);
    }
    
    // System configuration
    if (values.acpi) {
        config.acpi = true;
    }
    
    if (values.fastboot) {
        config.fastboot = true;
    }
    
    // Input/output configuration
    if (values['disable-keyboard']) {
        config.disable_keyboard = true;
    }
    
    if (values['disable-mouse']) {
        config.disable_mouse = true;
    }
    
    if (values['disable-speaker']) {
        config.disable_speaker = true;
    }
    
    // Debug configuration
    const logLevel = parseInt(values['log-level']);
    if (!isNaN(logLevel)) {
        config.log_level = logLevel;
    }
    
    // Network configuration
    // if (values.netdev) {
    //     // Simple netdev parsing - could be enhanced for more complex configs
    //     config.net_device = {
    //         type: "virtio",
    //         relay_url: values.netdev
    //     };
    // }
    
    // Create and start the emulator
    var emulator = new V86(config);
    
    emulator.add_listener("serial0-output-byte", (b) => process.stdout.write(String.fromCharCode(b)));
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => {
        if(c === "\u0003") { // ctrl c
            emulator.destroy();
            process.stdin.pause();
        } else {
            emulator.serial0_send(c);
        }
    });
}