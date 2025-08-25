#!/usr/bin/env node
import { parseArgs } from 'util';
import pkg from './package.json' with { type: 'json' };
import path from "node:path";
import url from "node:url";
import { V86 } from "./assets/libv86.mjs";

const assetsDir = url.fileURLToPath(new URL("./assets", import.meta.url));

function showHelp() {
    console.log(`${pkg.name} v${pkg.version}`);
    console.log(pkg.description);
    console.log('');
    console.log('Usage:');
    console.log('  v86-system [options]');

    console.log('');
    console.log('Memory options:');
    console.log('  -m SIZE               Set memory size (default: 512M)');

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
    console.log('  -bios FILE            BIOS image file (default: seabios)');
    console.log('  -acpi                 Enable ACPI (default: off)');
    console.log('  -fastboot             Enable fast boot');

    console.log('');
    console.log('Network options:');
    console.log('  -netdev CONFIG        Network device configuration');
  

    console.log('');
    console.log('VirtFS options:');
    console.log('  -virtfs CONFIG        VirtFS configuration');

    console.log('');
    console.log('Standard options:');
    console.log('  -h, --help            Show help');
    console.log('  -v, --version         Show version');
  
    console.log('');
    console.log('Examples:');
    console.log('  v86-system -hda disk.img');
    console.log('  v86-system -m 1G -hda disk.img -cdrom boot.iso');
    console.log('  v86-system -kernel vmlinuz -initrd initrd.img -append "console=ttyS0"');
    console.log('  v86-system -hda disk.img -netdev user,type=virtio,relay_url=ws://localhost:8777');
    console.log('');
}

function showVersion() {
    console.log(pkg.version);
}

// Parse memory size strings like "512M", "1G", etc.
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

function createV86Image(filePath) {
    if (!filePath) return undefined;
    return { url: path.resolve(filePath) };
}

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
        acpi: {
            type: 'boolean',
            default: false,
        },
        fastboot: {
            type: 'boolean',
            default: false,
        },
        
        // Network options
        netdev: {
            type: 'string',
        },

        // VirtFS options
        virtfs: {
            type: 'string',
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
        autostart: true,
    };
    
    // Memory configuration
    const memorySize = parseMemorySize(values.mem);
    if (memorySize) {
        config.memory_size = memorySize;
    }
    

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
    const biosPath = values.bios || path.join(assetsDir, "seabios.bin");
    config.bios = { url: biosPath };

    if (values.acpi) {
        config.acpi = true;
    }
    
    if (values.fastboot) {
        config.fastboot = true;
    }
    
    // Network configuration
    if (values.netdev) {
        const parts = values.netdev.split(",");
        const mode = parts.shift();
        if (mode === "user") {
            config.net_device = Object.fromEntries(parts.map(item => item.split('=')));
        }
    }

    // VirtFS configuration
    if (values.virtfs) {
        config.filesystem = {};
        const parts = values.virtfs.split(",");
        const mode = parts.shift();
        if (mode === "proxy") {
            config.filesystem.proxy_url = parts.shift();
        }
    }
    
    // Create and start the emulator
    const emulator = new V86(config);
    emulator.add_listener("serial0-output-byte", (b) => process.stdout.write(String.fromCharCode(b)));
    
    // Handle graceful shutdown
    function cleanup() {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        emulator.destroy();
        process.exit(0);
    }
    
    // Handle SIGTERM signal (but not SIGINT - we want to pass Ctrl+C to guest)
    process.on('SIGTERM', cleanup);
    
    // Escape sequence state
    let escapeMode = false;
    
    // Setup stdin handling if available
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        console.log("* v86 emulator started. Press Ctrl+A then X to exit.");
    }
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => {
        if (escapeMode) {
            escapeMode = false;
            if (c.toLowerCase() === 'x') {
                cleanup();
                return;
            }
            // If not 'x', send the escape sequence to guest
            emulator.serial0_send("\u0001"); // Send Ctrl+A
            emulator.serial0_send(c);        // Send the following character
        } else if (c === "\u0001") { // Ctrl+A
            escapeMode = true;
        } else {
            // Send all other characters (including Ctrl+C) to the guest
            emulator.serial0_send(c);
        }
    });
}